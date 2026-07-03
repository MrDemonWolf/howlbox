import {
	buildEmoteImageUrl,
	ChatClient,
	type ChatMessage,
	parseChatMessage,
} from "@twurple/chat";

import { fallbackColor } from "./colors";
import type { ChatMessageView, ConnectionStatus, MessagePart } from "./types";

export interface ChatHandlers {
	onMessage: (message: ChatMessageView) => void;
	onMessageRemove: (messageId: string) => void;
	onUserPurge: (login: string) => void;
	onClear: () => void;
	onStatus: (status: ConnectionStatus) => void;
}

// Anonymous (justinfan) connection: read-only, no auth, but still
// receives full IRCv3 tags (badges, color, emotes, message id).
export function connectChat(
	channel: string,
	handlers: ChatHandlers,
): () => void {
	const joined = channel.replace(/^#/, "").toLowerCase();
	// quit() can race the connect handshake and leave a zombie client
	// that finishes connecting and auto-reconnects; the closed flag
	// silences every handler and onConnect re-quits the zombie
	let closed = false;
	const client = new ChatClient({
		channels: [joined],
		rejoinChannelsOnReconnect: true,
	});

	client.onMessage((_channel, user, text, msg) => {
		if (!closed) {
			handlers.onMessage(toView(user, text, msg, false));
		}
	});
	client.onAction((_channel, user, text, msg) => {
		if (!closed) {
			handlers.onMessage(toView(user, text, msg, true));
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
		if (closed) {
			client.quit();
			return;
		}
		handlers.onStatus("connected");
	});
	client.onDisconnect(() => {
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

	// OBS throttles timers while a source is hidden, which can stall
	// twurple's timer-based retry; nudge reconnects off events too
	const nudge = () => {
		if (!closed && !client.isConnected && !client.isConnecting) {
			client.reconnect();
		}
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

function toView(
	login: string,
	text: string,
	msg: ChatMessage,
	isAction: boolean,
): ChatMessageView {
	const parts: MessagePart[] = [];
	for (const part of parseChatMessage(text, msg.emoteOffsets)) {
		if (part.type === "emote") {
			parts.push({
				type: "emote",
				name: part.name,
				id: part.id,
				url: buildEmoteImageUrl(part.id, { size: "2.0" }),
			});
		} else if (part.type === "text") {
			parts.push({ type: "text", text: part.text });
		}
	}

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
		parts,
		isAction,
		isPrivileged: msg.userInfo.isBroadcaster || msg.userInfo.isMod,
		timestamp: msg.date.getTime(),
	};
}
