import { type RefObject, useEffect, useRef } from "react";

import { type EmoteMap, fetchEmoteMap } from "@/lib/emotes/emotes";
import type { BadgeMap } from "@/lib/emotes/resolve";
import { fetchBadgeMap } from "@/lib/twitch/badges";

// Returned as a ref (not state) on purpose: the chat hook reads
// .current at append time, so a map arriving after connect never
// re-triggers the connection effect or re-renders old rows. The
// `active` guard drops a late resolve after the channel changed.
function useAsyncRef<T>(
	channel: string | undefined,
	fetcher: (channel: string) => Promise<T>,
): RefObject<T | null> {
	const ref = useRef<T | null>(null);
	useEffect(() => {
		ref.current = null;
		if (!channel) {
			return;
		}
		let active = true;
		fetcher(channel)
			.then((value) => {
				if (active) {
					ref.current = value;
				}
			})
			.catch(() => {
				// the overlay works fine without this data
			});
		return () => {
			active = false;
		};
	}, [channel, fetcher]);
	return ref;
}

export function useEmoteMap(channel: string | undefined) {
	return useAsyncRef<EmoteMap>(channel, fetchEmoteMap);
}

export function useBadgeMap(channel: string | undefined) {
	return useAsyncRef<BadgeMap>(channel, fetchBadgeMap);
}
