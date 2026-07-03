// Badge images without secrets: the old badges.twitch.tv API is
// DNS-dead and Helix wants a token, so api.ivr.fi serves Helix-shaped
// badge JSON with open CORS (verified live). Channel response covers
// per-channel subscriber/bits art. Cached with stale-if-error in
// emotes.ts style via the same localStorage keys.

import type { BadgeMap } from "@/lib/emotes/resolve";

const CACHE_PREFIX = "hb-cache-v1:";

interface HelixBadgeSet {
	set_id?: string;
	versions?: { id?: string; image_url_2x?: string; image_url_1x?: string }[];
}

async function cachedJson(
	key: string,
	ttlMs: number,
	url: string,
): Promise<unknown> {
	const storageKey = CACHE_PREFIX + key;
	let stale: unknown = null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const entry = JSON.parse(raw) as { t: number; v: unknown };
			if (Date.now() - entry.t < ttlMs) {
				return entry.v;
			}
			stale = entry.v;
		}
	} catch {
		// ignore bad cache entries
	}
	try {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(String(res.status));
		}
		const value = (await res.json()) as unknown;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ t: Date.now(), v: value }),
			);
		} catch {
			// storage full
		}
		return value;
	} catch {
		return stale;
	}
}

function addSets(map: BadgeMap, sets: HelixBadgeSet[] | null) {
	for (const set of sets ?? []) {
		if (!set.set_id) {
			continue;
		}
		for (const version of set.versions ?? []) {
			const url = version.image_url_2x ?? version.image_url_1x;
			if (version.id && url) {
				map.set(`${set.set_id}/${version.id}`, url);
			}
		}
	}
}

export async function fetchBadgeMap(login: string): Promise<BadgeMap> {
	const [global, channel] = await Promise.all([
		cachedJson(
			"badges-global",
			6 * 60 * 60_000,
			"https://api.ivr.fi/v2/twitch/badges/global",
		),
		cachedJson(
			`badges-channel:${login}`,
			60 * 60_000,
			`https://api.ivr.fi/v2/twitch/badges/channel?login=${encodeURIComponent(login)}`,
		),
	]);
	const map: BadgeMap = new Map();
	addSets(map, global as HelixBadgeSet[] | null);
	// channel sets override global (per-channel subscriber art)
	addSets(map, channel as HelixBadgeSet[] | null);
	return map;
}
