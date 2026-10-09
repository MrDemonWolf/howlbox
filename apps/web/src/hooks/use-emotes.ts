import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { type EmoteMap, fetchEmoteMap } from "@/lib/emotes/emotes";
import type { MediaPreferences } from "@/lib/emotes/media";
import type { BadgeMap } from "@/lib/emotes/resolve";
import {
	fetchBadgeMap,
	fetchGistBadgeArt,
	mergeBadgeArt,
	parseCustomBadgeArt,
} from "@/lib/twitch/badges";

interface AsyncFetchOptions {
	forceChannel: boolean;
	signal: AbortSignal;
}

function mapIsEmpty(value: ReadonlyMap<unknown, unknown>): boolean {
	return value.size === 0;
}

// The stable ref avoids reconnecting chat when provider maps load. Revision
// changes let the chat hook refresh retained rows without replacing the ref.
function useAsyncRef<T>(
	channel: string | undefined,
	fetcher: (channel: string, options: AsyncFetchOptions) => Promise<T>,
	refreshMinutes = 0,
	isEmpty?: (value: T) => boolean,
): readonly [RefObject<T | null>, number] {
	const ref = useRef<T | null>(null);
	const [revision, setRevision] = useState(0);
	const previousChannelRef = useRef(channel);
	useEffect(() => {
		if (previousChannelRef.current !== channel || !channel) {
			ref.current = null;
		}
		previousChannelRef.current = channel;
		if (!channel) {
			return;
		}
		let active = true;
		let inFlight = false;
		const controller = new AbortController();
		const load = (forceChannel: boolean) => {
			if (inFlight) {
				return;
			}
			inFlight = true;
			void fetcher(channel, {
				forceChannel,
				signal: controller.signal,
			})
				.then((value) => {
					// A total provider outage must not replace a working in-memory
					// map. A new channel still accepts empty as its initial result.
					if (active && (ref.current === null || !isEmpty?.(value))) {
						ref.current = value;
						setRevision((current) => current + 1);
					}
				})
				.catch(() => {
					// The overlay works fine without third-party media.
				})
				.finally(() => {
					inFlight = false;
				});
		};
		load(false);
		const timer =
			refreshMinutes > 0
				? setInterval(() => load(true), refreshMinutes * 60_000)
				: undefined;
		return () => {
			active = false;
			controller.abort();
			if (timer !== undefined) {
				clearInterval(timer);
			}
		};
	}, [channel, fetcher, refreshMinutes, isEmpty]);
	return [ref, revision];
}

export function useEmoteMap(
	channel: string | undefined,
	refreshMinutes = 0,
	preferences: MediaPreferences = {},
) {
	const assetScale = preferences.assetScale ?? 1;
	const staticMedia = preferences.staticMedia ?? false;
	const fetcher = useCallback(
		(login: string, options: AsyncFetchOptions) =>
			fetchEmoteMap(login, { ...options, assetScale, staticMedia }),
		[assetScale, staticMedia],
	);
	return useAsyncRef<EmoteMap>(channel, fetcher, refreshMinutes, mapIsEmpty);
}

// Precedence, weakest to strongest: Twitch < gist < inline, so a one-off
// inline tweak beats the shared gist. Provider failures are isolated so
// custom art still works when Twitch or GitHub is unavailable.
export function useBadgeMap(
	channel: string | undefined,
	customArt = "",
	gistRef = "",
	refreshMinutes = 0,
	preferences: MediaPreferences = {},
) {
	const assetScale = preferences.assetScale ?? 1;
	const fetcher = useCallback(
		async (login: string, options: AsyncFetchOptions): Promise<BadgeMap> => {
			const [mapResult, gistResult] = await Promise.allSettled([
				fetchBadgeMap(login, {
					...options,
					assetScale,
				}),
				gistRef
					? fetchGistBadgeArt(gistRef, options)
					: Promise.resolve([] as [string, string][]),
			]);
			const map: BadgeMap =
				mapResult.status === "fulfilled" ? mapResult.value : new Map();
			const gistPairs =
				gistResult.status === "fulfilled" ? gistResult.value : [];
			mergeBadgeArt(map, gistPairs);
			mergeBadgeArt(map, parseCustomBadgeArt(customArt));
			return map;
		},
		[assetScale, customArt, gistRef],
	);
	return useAsyncRef<BadgeMap>(channel, fetcher, refreshMinutes, mapIsEmpty);
}
