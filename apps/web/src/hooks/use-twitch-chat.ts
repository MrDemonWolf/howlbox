import { type RefObject, useEffect, useState } from "react";

import type { EmoteMap } from "@/lib/emotes/emotes";
import { type BadgeMap, resolveMessageExtras } from "@/lib/emotes/resolve";
import { connectChat } from "@/lib/twitch/chat";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

export interface UseTwitchChatOptions {
	maxMessages?: number;
	// hold non-privileged messages this long so moderation deletes
	// land before the overlay shows them; mods/broadcaster skip it
	delaySeconds?: number;
	hiddenLogins?: readonly string[];
	// featured mode: when non-empty, only these logins are shown
	allowedLogins?: readonly string[];
	hideCommands?: boolean;
	// read at append time; ref identity is stable so late-loading
	// maps never tear down the connection
	emotesRef?: RefObject<EmoteMap | null>;
	badgesRef?: RefObject<BadgeMap | null>;
}

const DEFAULT_MAX_MESSAGES = 50;

export function useTwitchChat(
	channel: string | undefined,
	options: UseTwitchChatOptions = {},
) {
	const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
	const delaySeconds = options.delaySeconds ?? 0;
	const hiddenKey = (options.hiddenLogins ?? []).join(",");
	const allowedKey = (options.allowedLogins ?? []).join(",");
	const hideCommands = options.hideCommands ?? false;
	const [messages, setMessages] = useState<ChatMessageView[]>([]);
	const [status, setStatus] = useState<ConnectionStatus>("connecting");

	// emotesRef/badgesRef are read via .current at append time on
	// purpose; adding them to the deps would tear down and rebuild the
	// chat connection whenever a map loads (see use-emotes.ts).
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional ref-at-append pattern
	useEffect(() => {
		if (!channel) {
			return;
		}
		// stale-closure guard: after cleanup, a torn-down connection
		// must not be able to push state (double-mounts, HMR, races)
		let active = true;
		const hidden = new Set(hiddenKey.split(",").filter(Boolean));
		const allowed = new Set(allowedKey.split(",").filter(Boolean));
		// pending = delayed messages not yet shown; bounded because a
		// long delay in a fast chat would otherwise queue thousands
		const pending = new Map<
			string,
			{ message: ChatMessageView; timer: ReturnType<typeof setTimeout> }
		>();
		const maxPending = Math.max(200, maxMessages * 2);

		const append = (message: ChatMessageView) => {
			if (!active) {
				return;
			}
			setMessages((prev) =>
				prev.some((m) => m.id === message.id)
					? prev
					: [...prev, message].slice(-maxMessages),
			);
		};

		const promote = (id: string) => {
			const entry = pending.get(id);
			if (!entry) {
				return;
			}
			pending.delete(id);
			append(entry.message);
		};

		const dropPending = (predicate: (m: ChatMessageView) => boolean) => {
			for (const [id, entry] of pending) {
				if (predicate(entry.message)) {
					clearTimeout(entry.timer);
					pending.delete(id);
				}
			}
		};

		setMessages([]);
		const disconnect = connectChat(channel, {
			onMessage: (raw) => {
				if (!active || hidden.has(raw.login)) {
					return;
				}
				if (allowed.size > 0 && !allowed.has(raw.login)) {
					return;
				}
				if (hideCommands) {
					const first = raw.parts[0];
					if (
						first?.type === "text" &&
						first.text.trimStart().startsWith("!")
					) {
						return;
					}
				}
				const message = resolveMessageExtras(
					raw,
					options.emotesRef?.current ?? null,
					options.badgesRef?.current ?? null,
				);
				if (delaySeconds > 0 && !message.isPrivileged) {
					// note: OBS throttles timers while the source is
					// hidden; messages promote late, but nothing is
					// visible then anyway
					if (pending.size >= maxPending) {
						const oldest = pending.keys().next().value;
						if (oldest !== undefined) {
							clearTimeout(pending.get(oldest)?.timer);
							pending.delete(oldest);
						}
					}
					const timer = setTimeout(
						() => promote(message.id),
						delaySeconds * 1000,
					);
					pending.set(message.id, { message, timer });
					return;
				}
				append(message);
			},
			onMessageRemove: (messageId) => {
				if (!active) {
					return;
				}
				dropPending((m) => m.id === messageId);
				setMessages((prev) => prev.filter((m) => m.id !== messageId));
			},
			onUserPurge: (login) => {
				if (!active) {
					return;
				}
				dropPending((m) => m.login === login);
				setMessages((prev) => prev.filter((m) => m.login !== login));
			},
			onClear: () => {
				if (!active) {
					return;
				}
				dropPending(() => true);
				setMessages([]);
			},
			onStatus: (status) => {
				if (active) {
					setStatus(status);
				}
			},
		});
		return () => {
			active = false;
			dropPending(() => true);
			disconnect();
		};
	}, [channel, maxMessages, delaySeconds, hiddenKey, allowedKey, hideCommands]);

	return { messages, status };
}
