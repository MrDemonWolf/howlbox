import { type RefObject, useEffect, useRef } from "react";

import { type EmoteMap, fetchEmoteMap } from "@/lib/emotes/emotes";
import type { BadgeMap } from "@/lib/emotes/resolve";
import { fetchBadgeMap } from "@/lib/twitch/badges";

// Returned as refs (not state) on purpose: the chat hook reads
// .current at append time, so a map arriving after connect never
// re-triggers the connection effect or re-renders old rows.

export function useEmoteMap(
	channel: string | undefined,
): RefObject<EmoteMap | null> {
	const ref = useRef<EmoteMap | null>(null);
	useEffect(() => {
		ref.current = null;
		if (!channel) {
			return;
		}
		let active = true;
		fetchEmoteMap(channel)
			.then((map) => {
				if (active) {
					ref.current = map;
				}
			})
			.catch(() => {
				// overlay works without third-party emotes
			});
		return () => {
			active = false;
		};
	}, [channel]);
	return ref;
}

export function useBadgeMap(
	channel: string | undefined,
): RefObject<BadgeMap | null> {
	const ref = useRef<BadgeMap | null>(null);
	useEffect(() => {
		ref.current = null;
		if (!channel) {
			return;
		}
		let active = true;
		fetchBadgeMap(channel)
			.then((map) => {
				if (active) {
					ref.current = map;
				}
			})
			.catch(() => {
				// overlay works without badge art
			});
		return () => {
			active = false;
		};
	}, [channel]);
	return ref;
}
