import {
	buildEmoteImageUrl,
	ChatClient,
	type ChatMessage,
	type EmoteSettings,
	parseChatMessage,
	type UserNotice,
} from "@twurple/chat";

import { fallbackColor } from "./colors";
import {
	createGiftDeduper,
	decorateMessage,
	describeCommunitySub,
	describeGiftUpgrade,
	describePrimeUpgrade,
	describeRaid,
	describeResub,
	describeSub,
	describeSubGift,
	gifterKey,
	stripCheermoteTokens,
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
	// native Twitch CDN settings; defaults preserve the existing 2x assets
	emoteScale?: 1 | 2 | 3;
	// request a still frame for native animated emotes
	staticMedia?: boolean;
}

const EMOTE_SIZE = {
	1: "1.0",
	2: "2.0",
	3: "3.0",
} as const;
// Anonymous (justinfan) connection: read-only, no auth, but still
// receives full IRCv3 tags (badges, color, emotes, message id).
export function connectChat(
	channel: string,
	handlers: ChatHandlers,
	options: ChatOptions = {},
): () => void {
	const events = options.events ?? new Set<ChatEventKind>();
	const joined = channel.replace(/^#/, "").toLowerCase();
	const mediaPreferences = {
		assetScale: options.emoteScale ?? 2,
		staticMedia: options.staticMedia ?? false,
	} as const;
	const emoteSettings: EmoteSettings = {
		animationSettings: mediaPreferences.staticMedia ? "static" : "default",
		size: EMOTE_SIZE[mediaPreferences.assetScale],
	};
	// A retired generation may still finish its current handshake. Every
	// handler checks identity, and onConnect re-quits a late socket.
	let closed = false;
	let restarting = false;
	let client: ChatClient | null = null;

	// cheers and first-time chatters are tags on a normal message, not
	// USERNOTICE; the decision itself is pure and lives in events.ts
	const decorate = (msg: ChatMessage): ChatEvent | undefined =>
		decorateMessage(
			{
				isCheer: msg.isCheer,
				bits: msg.bits,
				isFirst: msg.isFirst,
				isReturningChatter: msg.isReturningChatter,
			},
			events,
			mediaPreferences,
		);

	const startClient = () => {
		const ownedClient = new ChatClient({
			channels: [joined],
			rejoinChannelsOnReconnect: true,
		});
		client = ownedClient;
		const isCurrent = () => !closed && client === ownedClient;

		ownedClient.onMessage((_channel, user, text, msg) => {
			if (isCurrent()) {
				handlers.onMessage(
					toView(user, text, msg, false, emoteSettings, decorate(msg)),
				);
			}
		});
		ownedClient.onAction((_channel, user, text, msg) => {
			if (isCurrent()) {
				handlers.onMessage(
					toView(user, text, msg, true, emoteSettings, decorate(msg)),
				);
			}
		});
		ownedClient.onMessageRemove((_channel, messageId) => {
			if (isCurrent()) {
				handlers.onMessageRemove(messageId);
			}
		});
		ownedClient.onTimeout((_channel, user) => {
			if (isCurrent()) {
				handlers.onUserPurge(user);
			}
		});
		ownedClient.onBan((_channel, user) => {
			if (isCurrent()) {
				handlers.onUserPurge(user);
			}
		});
		ownedClient.onChatClear(() => {
			if (isCurrent()) {
				handlers.onClear();
			}
		});
		ownedClient.onConnect(() => {
			if (!isCurrent()) {
				ownedClient.quit();
				return;
			}
			handlers.onStatus("connected");
		});
		ownedClient.onDisconnect(() => {
			if (isCurrent()) {
				handlers.onStatus("disconnected");
			}
		});
		// a banned/suspended/nonexistent channel otherwise reports
		// "connected" while the overlay stays silently empty
		ownedClient.onJoinFailure((failedChannel) => {
			if (isCurrent() && failedChannel === joined) {
				handlers.onStatus("join_failed");
			}
		});

		// USERNOTICE events. Registered only for the requested kinds, so an
		// overlay without ?events= behaves exactly as it did before.
		const pushNotice = (msg: UserNotice, event: ChatEvent) => {
			if (isCurrent()) {
				handlers.onMessage(noticeToView(msg, event, emoteSettings));
			}
		};
		// swallows the per-recipient notices that follow a mass gift
		const gifts = createGiftDeduper();
		if (events.has("sub")) {
			ownedClient.onSub((_channel, _user, info, msg) => {
				pushNotice(msg, describeSub(info.displayName, info.plan));
			});
			ownedClient.onResub((_channel, _user, info, msg) => {
				pushNotice(
					msg,
					describeResub(info.displayName, info.plan, info.months, info.streak),
				);
			});
			ownedClient.onSubGift((_channel, _user, info, msg) => {
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
			ownedClient.onCommunitySub((_channel, _user, info, msg) => {
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
			ownedClient.onPrimePaidUpgrade((_channel, _user, info, msg) => {
				pushNotice(msg, describePrimeUpgrade(info.displayName, info.plan));
			});
			ownedClient.onGiftPaidUpgrade((_channel, _user, info, msg) => {
				pushNotice(
					msg,
					describeGiftUpgrade(info.displayName, info.gifterDisplayName),
				);
			});
		}
		if (events.has("raid")) {
			ownedClient.onRaid((_channel, _user, info, msg) => {
				pushNotice(msg, describeRaid(info.displayName, info.viewerCount));
			});
		}
		if (events.has("announce")) {
			ownedClient.onAnnouncement((_channel, _user, _info, msg) => {
				pushNotice(msg, { kind: "announce", text: "Announcement" });
			});
		}
		handlers.onStatus("connecting");
		ownedClient.connect();
	};

	// OBS throttles Twurple's retry timers while a source is hidden. Retire
	// the whole client on a nudge: reconnecting the same PersistentConnection
	// can let an old backoff timer create an orphaned second socket.
	const nudge = () => {
		const ownedClient = client;
		if (
			closed ||
			restarting ||
			ownedClient?.isConnected ||
			ownedClient?.isConnecting
		) {
			return;
		}
		restarting = true;
		try {
			client = null;
			ownedClient?.quit();
			startClient();
		} finally {
			restarting = false;
		}
	};
	const nudgeWhenVisible = () => {
		if (document.visibilityState === "visible") {
			nudge();
		}
	};
	const nudgeWhenObsVisible = (event: Event) => {
		if (
			(event as CustomEvent<{ visible?: boolean }>).detail?.visible === true
		) {
			nudge();
		}
	};
	const nudgeWhenObsActive = (event: Event) => {
		if ((event as CustomEvent<{ active?: boolean }>).detail?.active === true) {
			nudge();
		}
	};
	document.addEventListener("visibilitychange", nudgeWhenVisible);
	window.addEventListener("online", nudge);
	window.addEventListener("obsSourceVisibleChanged", nudgeWhenObsVisible);
	window.addEventListener("obsSourceActiveChanged", nudgeWhenObsActive);

	startClient();

	return () => {
		closed = true;
		const ownedClient = client;
		client = null;
		document.removeEventListener("visibilitychange", nudgeWhenVisible);
		window.removeEventListener("online", nudge);
		window.removeEventListener("obsSourceVisibleChanged", nudgeWhenObsVisible);
		window.removeEventListener("obsSourceActiveChanged", nudgeWhenObsActive);
		ownedClient?.quit();
	};
}

// Twitch native emotes out of the emote offset tags. Shared by messages
// and USERNOTICE bodies, which carry the same tag shape.
function toParts(
	text: string,
	offsets: Map<string, string[]>,
	settings: EmoteSettings,
): MessagePart[] {
	const parts: MessagePart[] = [];
	for (const part of parseChatMessage(text, offsets)) {
		if (part.type === "emote") {
			parts.push({
				type: "emote",
				name: part.name,
				url: buildEmoteImageUrl(part.id, settings),
			});
		} else if (part.type === "text") {
			parts.push({ type: "text", text: part.text });
		}
	}
	return parts;
}

// Stripping a cheer's tokens can empty a text part entirely (a message
// that was nothing but "Cheer100"); an empty span would still force the
// ": " separator, so drop them.
function dropEmptyText(parts: MessagePart[]): MessagePart[] {
	return parts.filter((part) => part.type !== "text" || part.text !== "");
}

function toView(
	login: string,
	text: string,
	msg: ChatMessage,
	isAction: boolean,
	emoteSettings: EmoteSettings,
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
		// a cheer's "Cheer100" tokens are art markup, not something the
		// person typed; the event line already carries the total
		parts: dropEmptyText(
			toParts(text, msg.emoteOffsets, emoteSettings).map((part) =>
				part.type === "text" && event?.kind === "cheer"
					? { ...part, text: stripCheermoteTokens(part.text) }
					: part,
			),
		),
		isAction,
		isPrivileged: msg.userInfo.isBroadcaster || msg.userInfo.isMod,
		isSubscriber: msg.userInfo.isSubscriber || msg.userInfo.isFounder,
		timestamp: msg.date.getTime(),
		event,
	};
}

// A USERNOTICE (sub, gift, raid, announcement) as a message row. The
// body is optional: a resub may carry a message, a raid never does.
function noticeToView(
	msg: UserNotice,
	event: ChatEvent,
	emoteSettings: EmoteSettings,
): ChatMessageView {
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
		parts: msg.text ? toParts(msg.text, msg.emoteOffsets, emoteSettings) : [],
		isAction: false,
		// events are system lines, not user speech: holding them behind the
		// moderation delay would land a raid alert minutes after the raid
		isPrivileged: true,
		isSubscriber: msg.userInfo.isSubscriber || msg.userInfo.isFounder,
		timestamp: msg.date.getTime(),
		event,
	};
}
