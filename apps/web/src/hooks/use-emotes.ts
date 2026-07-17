import { type RefObject, useCallback, useEffect, useRef } from "react";

import { type EmoteMap, fetchEmoteMap } from "@/lib/emotes/emotes";
import type { BadgeMap } from "@/lib/emotes/resolve";
import {
	fetchBadgeMap,
	fetchGistBadgeArt,
	parseCustomBadgeArt,
} from "@/lib/twitch/badges";

// Returned as a ref (not state) on purpose: the chat hook reads
// .current at append time, so a map arriving after connect never
// re-triggers the connection effect or re-renders old rows. The
// `active` guard drops a late resolve after the channel changed.
// refreshMinutes > 0 re-runs the fetcher on an interval with the
// cache TTLs bypassed (mid-stream emote/badge adds show up without a
// reload). OBS throttles timers in hidden sources, so a tick can land
// late; nothing is visible then anyway.
function useAsyncRef<T>(
	channel: string | undefined,
	fetcher: (channel: string, force: boolean) => Promise<T>,
	refreshMinutes = 0,
): RefObject<T | null> {
	const ref = useRef<T | null>(null);
	useEffect(() => {
		ref.current = null;
		if (!channel) {
			return;
		}
		let active = true;
		const load = (force: boolean) =>
			fetcher(channel, force)
				.then((value) => {
					if (active) {
						ref.current = value;
					}
				})
				.catch(() => {
					// the overlay works fine without this data
				});
		load(false);
		const timer =
			refreshMinutes > 0
				? setInterval(() => load(true), refreshMinutes * 60_000)
				: undefined;
		return () => {
			active = false;
			if (timer !== undefined) {
				clearInterval(timer);
			}
		};
	}, [channel, fetcher, refreshMinutes]);
	return ref;
}

export function useEmoteMap(channel: string | undefined, refreshMinutes = 0) {
	return useAsyncRef<EmoteMap>(channel, fetchEmoteMap, refreshMinutes);
}

// customArt is the raw ?badgeart string, gistRef the ?badgegist id/URL;
// both override the fetched Twitch art (global + per-channel sets ride
// in fetchBadgeMap). Precedence, weakest to strongest: Twitch < gist <
// inline, so a one-off inline tweak beats the shared gist.
export function useBadgeMap(
	channel: string | undefined,
	customArt = "",
	gistRef = "",
	refreshMinutes = 0,
) {
	const fetcher = useCallback(
		async (login: string, force: boolean): Promise<BadgeMap> => {
			const [map, gistPairs] = await Promise.all([
				fetchBadgeMap(login, force),
				gistRef
					? fetchGistBadgeArt(gistRef, force).catch(() => [])
					: Promise.resolve([] as [string, string][]),
			]);
			for (const [key, url] of gistPairs) {
				map.set(key, url);
			}
			for (const [key, url] of parseCustomBadgeArt(customArt)) {
				map.set(key, url);
			}
			return map;
		},
		[customArt, gistRef],
	);
	return useAsyncRef<BadgeMap>(channel, fetcher, refreshMinutes);
}
