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
	const client = new ChatClient({
		channels: [channel],
		rejoinChannelsOnReconnect: true,
	});

	client.onMessage((_channel, user, text, msg) => {
		handlers.onMessage(toView(user, text, msg, false));
	});
	client.onAction((_channel, user, text, msg) => {
		handlers.onMessage(toView(user, text, msg, true));
	});
	client.onMessageRemove((_channel, messageId) => {
		handlers.onMessageRemove(messageId);
	});
	client.onTimeout((_channel, user) => {
		handlers.onUserPurge(user);
	});
	client.onBan((_channel, user) => {
		handlers.onUserPurge(user);
	});
	client.onChatClear(() => {
		handlers.onClear();
	});
	client.onConnect(() => {
		handlers.onStatus("connected");
	});
	client.onDisconnect(() => {
		handlers.onStatus("disconnected");
	});

	handlers.onStatus("connecting");
	client.connect();

	return () => {
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
		timestamp: msg.date.getTime(),
	};
}
