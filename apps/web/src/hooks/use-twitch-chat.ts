import { type RefObject, useEffect, useState } from "react";

import type { AssetTier } from "@/lib/emotes/asset-tier";
import type { EmoteMap } from "@/lib/emotes/emotes";
import { type BadgeMap, resolveMessageExtras } from "@/lib/emotes/resolve";
import { resolveAvatar, warmAvatar } from "@/lib/twitch/avatars";
import { connectChat } from "@/lib/twitch/chat";
import {
	appendCapped,
	PendingBuffer,
	passesFilters,
	removeById,
	removeByLogin,
} from "@/lib/twitch/message-buffer";
import { resolvePronoun, warmPronoun } from "@/lib/twitch/pronouns";
import type {
	AvatarMode,
	ChatEventKind,
	ChatMessageView,
	ConnectionStatus,
} from "@/lib/twitch/types";

export interface UseTwitchChatOptions {
	maxMessages?: number;
	// hold non-privileged messages this long so moderation deletes
	// land before the overlay shows them; mods/broadcaster skip it
	delaySeconds?: number;
	hiddenLogins?: readonly string[];
	// featured mode: when non-empty, only these logins are shown
	allowedLogins?: readonly string[];
	hideCommands?: boolean;
	// fetch pronoun badges from pronouns.alejo.io (per-user, opt-in)
	pronouns?: boolean;
	// which sub/cheer/raid events to render as rows
	events?: readonly ChatEventKind[];
	// whose profile picture to fetch (off / everyone / subscribers only)
	avatars?: AvatarMode;
	// CDN variant bucket for native emote and cheermote art. A string, so
	// nudging ?emotescale within one bucket compares equal and does not
	// reconnect; crossing a bucket reconnects on purpose, since the rows
	// already on screen carry URLs baked at the old variant.
	assets?: AssetTier;
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
	const pronouns = options.pronouns ?? false;
	const eventsKey = (options.events ?? []).join(",");
	const avatars = options.avatars ?? "off";
	const assets = options.assets ?? "standard";
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
		const events = new Set(
			eventsKey.split(",").filter(Boolean),
		) as Set<ChatEventKind>;
		// pending = delayed messages not yet shown; bounded because a
		// long delay in a fast chat would otherwise queue thousands
		const pending = new PendingBuffer<{
			message: ChatMessageView;
			timer: ReturnType<typeof setTimeout>;
		}>(Math.max(200, maxMessages * 2));

		const append = (message: ChatMessageView) => {
			if (!active) {
				return;
			}
			setMessages((prev) => appendCapped(prev, message, maxMessages));
		};

		const promote = (id: string) => {
			const entry = pending.take(id);
			if (entry) {
				append(entry.message);
			}
		};

		const dropPending = (predicate: (m: ChatMessageView) => boolean) => {
			for (const entry of pending.drop(predicate)) {
				clearTimeout(entry.timer);
			}
		};

		setMessages([]);
		const disconnect = connectChat(
			channel,
			{
				onMessage: (raw) => {
					// hidden/allowed filtering and the "!command" rule (which
					// spares standalone event rows like raids and gifts)
					if (
						!active ||
						!passesFilters(raw, { hidden, allowed, hideCommands })
					) {
						return;
					}
					// per-user pronoun: warm the cache on first sight, read
					// whatever is cached now (first message may miss, repeats hit)
					if (pronouns) {
						warmPronoun(raw.login);
					}
					// same lazy shape for the avatar; "subs" reads the tag that
					// already arrived, so it costs no extra request to decide
					const wantsAvatar =
						avatars === "all" || (avatars === "subs" && raw.isSubscriber);
					if (wantsAvatar) {
						warmAvatar(raw.login);
					}
					const message = resolveMessageExtras(
						raw,
						options.emotesRef?.current ?? null,
						options.badgesRef?.current ?? null,
						pronouns ? resolvePronoun(raw.login) : null,
						wantsAvatar ? resolveAvatar(raw.login) : null,
					);
					if (delaySeconds > 0 && !message.isPrivileged) {
						// note: OBS throttles timers while the source is
						// hidden; messages promote late, but nothing is
						// visible then anyway
						const timer = setTimeout(
							() => promote(message.id),
							delaySeconds * 1000,
						);
						// the buffer evicts its oldest entry when full; clear that
						// stale timer so a promoted-then-dropped id can't fire
						const evicted = pending.add(message.id, { message, timer });
						if (evicted) {
							clearTimeout(evicted.timer);
						}
						return;
					}
					append(message);
				},
				onMessageRemove: (messageId) => {
					if (!active) {
						return;
					}
					dropPending((m) => m.id === messageId);
					setMessages((prev) => removeById(prev, messageId));
				},
				onUserPurge: (login) => {
					if (!active) {
						return;
					}
					dropPending((m) => m.login === login);
					setMessages((prev) => removeByLogin(prev, login));
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
			},
			{ events, assets },
		);
		return () => {
			active = false;
			dropPending(() => true);
			disconnect();
		};
	}, [
		channel,
		maxMessages,
		delaySeconds,
		hiddenKey,
		allowedKey,
		hideCommands,
		pronouns,
		eventsKey,
		avatars,
		assets,
	]);

	return { messages, status };
}
