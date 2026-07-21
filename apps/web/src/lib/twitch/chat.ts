import {
	buildEmoteImageUrl,
	ChatClient,
	type ChatMessage,
	parseChatMessage,
	type UserNotice,
} from "@twurple/chat";

import { fallbackColor } from "./colors";
import {
	createGiftDeduper,
	describeCheer,
	describeCommunitySub,
	describeFirstChat,
	describeGiftUpgrade,
	describePrimeUpgrade,
	describeRaid,
	describeResub,
	describeSub,
	describeSubGift,
	gifterKey,
} from "./events";
import type {
	ChatEvent,
	ChatEventKind,
	ChatMessageView,
	ConnectionStatus,
	MessagePart,
} from "./types";

export interface ChatHandlers {
	onMessage: (message: ChatMessageView) => void;
	onMessageRemove: (messageId: string) => void;
	onUserPurge: (login: string) => void;
	onClear: () => void;
	onStatus: (status: ConnectionStatus) => void;
}

export interface ChatOptions {
	// which event kinds to surface; empty means no event listeners are
	// registered at all, so the default overlay path is untouched
	events?: ReadonlySet<ChatEventKind>;
}

// Anonymous (justinfan) connection: read-only, no auth, but still
// receives full IRCv3 tags (badges, color, emotes, message id).
export function connectChat(
	channel: string,
	handlers: ChatHandlers,
	options: ChatOptions = {},
): () => void {
	const events = options.events ?? new Set<ChatEventKind>();
	const joined = channel.replace(/^#/, "").toLowerCase();
	// quit() can race the connect handshake and leave a zombie client
	// that finishes connecting and auto-reconnects; the closed flag
	// silences every handler and onConnect re-quits the zombie
	let closed = false;
	// bridges the sync gap before reconnect() flips isConnecting, so two
	// events firing in one tick cannot both trigger a reconnect
	let reconnecting = false;
	const client = new ChatClient({
		channels: [joined],
		rejoinChannelsOnReconnect: true,
	});

	// cheers and first-time chatters are tags on a normal message, not
	// USERNOTICE, so they are decided here rather than in a listener
	const decorate = (msg: ChatMessage): ChatEvent | undefined => {
		if (events.has("cheer") && msg.isCheer && msg.bits > 0) {
			return describeCheer(msg.bits);
		}
		if (events.has("first") && (msg.isFirst || msg.isReturningChatter)) {
			return describeFirstChat(!msg.isFirst);
		}
		return undefined;
	};

	client.onMessage((_channel, user, text, msg) => {
		if (!closed) {
			handlers.onMessage(toView(user, text, msg, false, decorate(msg)));
		}
	});
	client.onAction((_channel, user, text, msg) => {
		if (!closed) {
			handlers.onMessage(toView(user, text, msg, true, decorate(msg)));
		}
	});
	client.onMessageRemove((_channel, messageId) => {
		if (!closed) {
			handlers.onMessageRemove(messageId);
		}
	});
	client.onTimeout((_channel, user) => {
		if (!closed) {
			handlers.onUserPurge(user);
		}
	});
	client.onBan((_channel, user) => {
		if (!closed) {
			handlers.onUserPurge(user);
		}
	});
	client.onChatClear(() => {
		if (!closed) {
			handlers.onClear();
		}
	});
	client.onConnect(() => {
		reconnecting = false;
		if (closed) {
			client.quit();
			return;
		}
		handlers.onStatus("connected");
	});
	client.onDisconnect(() => {
		reconnecting = false;
		if (!closed) {
			handlers.onStatus("disconnected");
		}
	});
	// a banned/suspended/nonexistent channel otherwise reports
	// "connected" while the overlay stays silently empty
	client.onJoinFailure((failedChannel) => {
		if (!closed && failedChannel === joined) {
			handlers.onStatus("join_failed");
		}
	});

	// USERNOTICE events. Registered only for the requested kinds, so an
	// overlay without ?events= behaves exactly as it did before.
	const pushNotice = (msg: UserNotice, event: ChatEvent) => {
		if (!closed) {
			handlers.onMessage(noticeToView(msg, event));
		}
	};
	// swallows the per-recipient notices that follow a mass gift
	const gifts = createGiftDeduper();
	if (events.has("sub")) {
		client.onSub((_channel, _user, info, msg) => {
			pushNotice(msg, describeSub(info.displayName, info.plan));
		});
		client.onResub((_channel, _user, info, msg) => {
			pushNotice(
				msg,
				describeResub(info.displayName, info.plan, info.months, info.streak),
			);
		});
		client.onSubGift((_channel, _user, info, msg) => {
			// part of an already-announced mass gift: the batch line covers
			// it, so rendering this too would just repeat the same gift
			if (
				gifts.claim(
					gifterKey(info.gifterUserId, info.gifterDisplayName),
					msg.date.getTime(),
				)
			) {
				return;
			}
			pushNotice(
				msg,
				describeSubGift(
					info.plan,
					info.displayName,
					info.gifterDisplayName,
					info.giftDuration,
				),
			);
		});
		client.onCommunitySub((_channel, _user, info, msg) => {
			gifts.announce(
				gifterKey(info.gifterUserId, info.gifterDisplayName),
				info.count,
				msg.date.getTime(),
			);
			pushNotice(
				msg,
				describeCommunitySub(info.plan, info.count, info.gifterDisplayName),
			);
		});
		client.onPrimePaidUpgrade((_channel, _user, info, msg) => {
			pushNotice(msg, describePrimeUpgrade(info.displayName, info.plan));
		});
		client.onGiftPaidUpgrade((_channel, _user, info, msg) => {
			pushNotice(
				msg,
				describeGiftUpgrade(info.displayName, info.gifterDisplayName),
			);
		});
	}
	if (events.has("raid")) {
		client.onRaid((_channel, _user, info, msg) => {
			pushNotice(msg, describeRaid(info.displayName, info.viewerCount));
		});
	}
	if (events.has("announce")) {
		client.onAnnouncement((_channel, _user, _info, msg) => {
			pushNotice(msg, { kind: "announce", text: "Announcement" });
		});
	}

	// OBS throttles timers while a source is hidden, which can stall
	// twurple's timer-based retry; nudge reconnects off events too
	const nudge = () => {
		if (closed || reconnecting || client.isConnected || client.isConnecting) {
			return;
		}
		reconnecting = true;
		client.reconnect();
	};
	const nudgeWhenVisible = () => {
		if (document.visibilityState === "visible") {
			nudge();
		}
	};
	document.addEventListener("visibilitychange", nudgeWhenVisible);
	window.addEventListener("online", nudge);
	window.addEventListener("obsSourceVisibleChanged", nudge);
	window.addEventListener("obsSourceActiveChanged", nudge);

	handlers.onStatus("connecting");
	client.connect();

	return () => {
		closed = true;
		document.removeEventListener("visibilitychange", nudgeWhenVisible);
		window.removeEventListener("online", nudge);
		window.removeEventListener("obsSourceVisibleChanged", nudge);
		window.removeEventListener("obsSourceActiveChanged", nudge);
		client.quit();
	};
}

// Twitch native emotes out of the emote offset tags. Shared by messages
// and USERNOTICE bodies, which carry the same tag shape.
function toParts(text: string, offsets: Map<string, string[]>): MessagePart[] {
	const parts: MessagePart[] = [];
	for (const part of parseChatMessage(text, offsets)) {
		if (part.type === "emote") {
			parts.push({
				type: "emote",
				name: part.name,
				url: buildEmoteImageUrl(part.id, { size: "2.0" }),
			});
		} else if (part.type === "text") {
			parts.push({ type: "text", text: part.text });
		}
	}
	return parts;
}

function toView(
	login: string,
	text: string,
	msg: ChatMessage,
	isAction: boolean,
	event?: ChatEvent,
): ChatMessageView {
	return {
		id: msg.id,
		channelId: msg.channelId,
		login,
		displayName: msg.userInfo.displayName,
		// live tags deliver unset color as "" (not undefined), so || not ??
		color: msg.userInfo.color || fallbackColor(login),
		badges: [...msg.userInfo.badges].map(([set, version]) => ({
			set,
			version,
		})),
		renderBadges: [],
		parts: toParts(text, msg.emoteOffsets),
		isAction,
		isPrivileged: msg.userInfo.isBroadcaster || msg.userInfo.isMod,
		isSubscriber: msg.userInfo.isSubscriber || msg.userInfo.isFounder,
		timestamp: msg.date.getTime(),
		event,
	};
}

// A USERNOTICE (sub, gift, raid, announcement) as a message row. The
// body is optional: a resub may carry a message, a raid never does.
function noticeToView(msg: UserNotice, event: ChatEvent): ChatMessageView {
	const login = msg.userInfo.userName;
	return {
		id: msg.id,
		channelId: msg.channelId,
		login,
		displayName: msg.userInfo.displayName,
		color: msg.userInfo.color || fallbackColor(login),
		badges: [...msg.userInfo.badges].map(([set, version]) => ({
			set,
			version,
		})),
		renderBadges: [],
		parts: msg.text ? toParts(msg.text, msg.emoteOffsets) : [],
		isAction: false,
		// events are system lines, not user speech: holding them behind the
		// moderation delay would land a raid alert minutes after the raid
		isPrivileged: true,
		isSubscriber: msg.userInfo.isSubscriber || msg.userInfo.isFounder,
		timestamp: msg.date.getTime(),
		event,
	};
}
