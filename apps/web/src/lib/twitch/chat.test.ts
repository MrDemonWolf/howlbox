import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { ChatMessageView } from "./types";

type Listener = (...args: unknown[]) => void;

const clients: FakeChatClient[] = [];
const buildCalls: { id: string; settings: Record<string, unknown> }[] = [];
let parsedParts: unknown[] = [];

class FakeChatClient {
	readonly listeners = new Map<string, Listener>();
	isConnected = false;
	isConnecting = false;
	quitCount = 0;
	reconnectCount = 0;

	constructor(readonly config: unknown) {
		clients.push(this);
	}

	private register(name: string, listener: Listener) {
		this.listeners.set(name, listener);
	}

	onMessage(listener: Listener) {
		this.register("message", listener);
	}
	onAction(listener: Listener) {
		this.register("action", listener);
	}
	onMessageRemove(listener: Listener) {
		this.register("messageRemove", listener);
	}
	onTimeout(listener: Listener) {
		this.register("timeout", listener);
	}
	onBan(listener: Listener) {
		this.register("ban", listener);
	}
	onChatClear(listener: Listener) {
		this.register("clear", listener);
	}
	onConnect(listener: Listener) {
		this.register("connect", listener);
	}
	onDisconnect(listener: Listener) {
		this.register("disconnect", listener);
	}
	onJoinFailure(listener: Listener) {
		this.register("joinFailure", listener);
	}

	connect() {
		this.isConnecting = true;
	}

	quit() {
		this.quitCount++;
		this.isConnected = false;
		this.isConnecting = false;
	}

	reconnect() {
		this.reconnectCount++;
	}

	emit(name: string, ...args: unknown[]) {
		this.listeners.get(name)?.(...args);
	}

	disconnectUnexpectedly() {
		this.isConnected = false;
		this.isConnecting = false;
		this.emit("disconnect");
	}

	connectSuccessfully() {
		this.isConnected = true;
		this.isConnecting = false;
		this.emit("connect");
	}
}

mock.module("@twurple/chat", () => ({
	ChatClient: FakeChatClient,
	buildEmoteImageUrl: (id: string, settings: Record<string, unknown> = {}) => {
		buildCalls.push({ id, settings });
		return `${id}:${String(settings.size)}:${String(settings.animationSettings)}`;
	},
	parseChatMessage: () => parsedParts,
}));

const { connectChat } = await import("./chat");

class FakeTarget {
	visibilityState: DocumentVisibilityState = "visible";
	private readonly listeners = new Map<
		string,
		Set<EventListenerOrEventListenerObject>
	>();

	addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);
	}

	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
	) {
		this.listeners.get(type)?.delete(listener);
	}

	dispatch(type: string, detail?: unknown) {
		const event = { type, detail } as CustomEvent;
		for (const listener of this.listeners.get(type) ?? []) {
			if (typeof listener === "function") {
				listener(event);
			} else {
				listener.handleEvent(event);
			}
		}
	}

	listenerCount(type: string) {
		return this.listeners.get(type)?.size ?? 0;
	}
}

const documentDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"document",
);
const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
let fakeDocument: FakeTarget;
let fakeWindow: FakeTarget;

function restoreGlobal(
	name: "document" | "window",
	descriptor?: PropertyDescriptor,
) {
	if (descriptor) {
		Object.defineProperty(globalThis, name, descriptor);
	} else {
		Reflect.deleteProperty(globalThis, name);
	}
}

function handlers(
	statuses: string[],
	messages: ChatMessageView[] = [],
): Parameters<typeof connectChat>[1] {
	return {
		onMessage: (message) => messages.push(message),
		onMessageRemove: () => undefined,
		onUserPurge: () => undefined,
		onClear: () => undefined,
		onStatus: (status) => statuses.push(status),
	};
}

beforeEach(() => {
	clients.length = 0;
	buildCalls.length = 0;
	parsedParts = [];
	fakeDocument = new FakeTarget();
	fakeWindow = new FakeTarget();
	Object.defineProperty(globalThis, "document", {
		configurable: true,
		value: fakeDocument,
	});
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: fakeWindow,
	});
});

afterEach(() => {
	restoreGlobal("document", documentDescriptor);
	restoreGlobal("window", windowDescriptor);
});

describe("connectChat generations", () => {
	test("a nudge retires the whole failed client and ignores late events", () => {
		const statuses: string[] = [];
		const disconnect = connectChat("#MixedCase", handlers(statuses));
		const first = clients[0];
		expect(first?.config).toEqual({
			channels: ["mixedcase"],
			rejoinChannelsOnReconnect: true,
		});
		expect(statuses).toEqual(["connecting"]);

		first?.disconnectUnexpectedly();
		expect(statuses).toEqual(["connecting", "disconnected"]);
		fakeWindow.dispatch("online");

		expect(clients).toHaveLength(2);
		expect(first?.quitCount).toBe(1);
		expect(first?.reconnectCount).toBe(0);
		expect(statuses).toEqual(["connecting", "disconnected", "connecting"]);

		first?.connectSuccessfully();
		expect(first?.quitCount).toBe(2);
		expect(statuses.at(-1)).toBe("connecting");

		const second = clients[1];
		fakeWindow.dispatch("obsSourceVisibleChanged");
		expect(clients).toHaveLength(2);
		second?.connectSuccessfully();
		expect(statuses.at(-1)).toBe("connected");

		disconnect();
		expect(second?.quitCount).toBe(1);
		expect(fakeDocument.listenerCount("visibilitychange")).toBe(0);
		expect(fakeWindow.listenerCount("online")).toBe(0);
		expect(fakeWindow.listenerCount("obsSourceVisibleChanged")).toBe(0);
		expect(fakeWindow.listenerCount("obsSourceActiveChanged")).toBe(0);
	});

	test("OBS source events nudge only when becoming visible or active", () => {
		const disconnect = connectChat("channel", handlers([]));
		clients[0]?.disconnectUnexpectedly();

		fakeWindow.dispatch("obsSourceVisibleChanged", { visible: false });
		fakeWindow.dispatch("obsSourceActiveChanged", { active: false });
		expect(clients).toHaveLength(1);

		fakeWindow.dispatch("obsSourceActiveChanged", { active: true });
		expect(clients).toHaveLength(2);
		clients[1]?.disconnectUnexpectedly();

		fakeWindow.dispatch("obsSourceVisibleChanged", { visible: true });
		expect(clients).toHaveLength(3);
		disconnect();
	});

	test("native emote URLs honor scale and static media options", () => {
		parsedParts = [{ type: "emote", id: "25", name: "Kappa" }];
		const messages: ChatMessageView[] = [];
		const disconnect = connectChat("channel", handlers([], messages), {
			emoteScale: 3,
			events: new Set(["cheer"] as const),
			staticMedia: true,
		});
		const message = {
			id: "m1",
			channelId: "c1",
			emoteOffsets: new Map(),
			date: new Date(1),
			isCheer: true,
			bits: 100,
			isFirst: false,
			isReturningChatter: false,
			userInfo: {
				displayName: "User",
				color: "#ffffff",
				badges: new Map(),
				isBroadcaster: false,
				isMod: false,
				isSubscriber: false,
				isFounder: false,
			},
		};
		clients[0]?.emit("message", "channel", "user", "Kappa", message);

		expect(buildCalls).toEqual([
			{
				id: "25",
				settings: { animationSettings: "static", size: "3.0" },
			},
		]);
		expect(messages[0]?.parts).toEqual([
			{
				type: "emote",
				name: "Kappa",
				url: "25:3.0:static",
			},
		]);
		expect(messages[0]?.event).toEqual({
			kind: "cheer",
			text: "cheered 100 bits",
			cheermoteUrl: "https://static-cdn.jtvnw.net/bits/dark/static/100/3.png",
		});
		disconnect();
	});
});
