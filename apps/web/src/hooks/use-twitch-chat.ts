import { useEffect, useState } from "react";

import { connectChat } from "@/lib/twitch/chat";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

export interface UseTwitchChatOptions {
	maxMessages?: number;
}

const DEFAULT_MAX_MESSAGES = 50;

export function useTwitchChat(
	channel: string | undefined,
	options: UseTwitchChatOptions = {},
) {
	const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
	const [messages, setMessages] = useState<ChatMessageView[]>([]);
	const [status, setStatus] = useState<ConnectionStatus>("connecting");

	useEffect(() => {
		if (!channel) {
			return;
		}
		setMessages([]);
		return connectChat(channel, {
			onMessage: (message) => {
				setMessages((prev) => [...prev, message].slice(-maxMessages));
			},
			onMessageRemove: (messageId) => {
				setMessages((prev) => prev.filter((m) => m.id !== messageId));
			},
			onUserPurge: (login) => {
				setMessages((prev) => prev.filter((m) => m.login !== login));
			},
			onClear: () => {
				setMessages([]);
			},
			onStatus: setStatus,
		});
	}, [channel, maxMessages]);

	return { messages, status };
}
