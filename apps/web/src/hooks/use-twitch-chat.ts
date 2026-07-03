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
		// stale-closure guard: after cleanup, a torn-down connection
		// must not be able to push state (double-mounts, HMR, races)
		let active = true;
		setMessages([]);
		const disconnect = connectChat(channel, {
			onMessage: (message) => {
				if (!active) {
					return;
				}
				setMessages((prev) =>
					prev.some((m) => m.id === message.id)
						? prev
						: [...prev, message].slice(-maxMessages),
				);
			},
			onMessageRemove: (messageId) => {
				if (active) {
					setMessages((prev) => prev.filter((m) => m.id !== messageId));
				}
			},
			onUserPurge: (login) => {
				if (active) {
					setMessages((prev) => prev.filter((m) => m.login !== login));
				}
			},
			onClear: () => {
				if (active) {
					setMessages([]);
				}
			},
			onStatus: (status) => {
				if (active) {
					setStatus(status);
				}
			},
		});
		return () => {
			active = false;
			disconnect();
		};
	}, [channel, maxMessages]);

	return { messages, status };
}
