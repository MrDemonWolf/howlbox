// Badge images without secrets: the old badges.twitch.tv API is
// DNS-dead and Helix wants a token, so api.ivr.fi serves Helix-shaped
// badge JSON with open CORS (verified live). Channel response covers
// per-channel subscriber/bits art. Shared fetch + cache: @/lib/cache.

import { cachedJson, ONE_HOUR_MS, SIX_HOURS_MS } from "@/lib/cache";
import type { BadgeMap } from "@/lib/emotes/resolve";

interface HelixBadgeSet {
	set_id?: string;
	versions?: { id?: string; image_url_2x?: string; image_url_1x?: string }[];
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

export async function fetchBadgeMap(
	login: string,
	force = false,
): Promise<BadgeMap> {
	const [global, channel] = await Promise.all([
		cachedJson<HelixBadgeSet[]>(
			"badges-global",
			SIX_HOURS_MS,
			"https://api.ivr.fi/v2/twitch/badges/global",
			force,
		),
		cachedJson<HelixBadgeSet[]>(
			`badges-channel:${login}`,
			ONE_HOUR_MS,
			`https://api.ivr.fi/v2/twitch/badges/channel?login=${encodeURIComponent(login)}`,
			force,
		),
	]);
	const map: BadgeMap = new Map();
	addSets(map, global);
	// channel sets override global (per-channel subscriber art)
	addSets(map, channel);
	return map;
}

// Custom badge art from the ?badgeart param. Comma list of
// "<set>/<version>=<image url>" or "<set>=<image url>" pairs; a bare
// set key covers every version of that set (resolve.ts falls back to
// it). Bad entries are dropped, never fatal, same spirit as params.ts.
export function parseCustomBadgeArt(raw: string): [string, string][] {
	const out: [string, string][] = [];
	for (const pair of raw.split(",")) {
		const eq = pair.indexOf("=");
		if (eq <= 0) {
			continue;
		}
		const key = pair.slice(0, eq).trim();
		const url = pair.slice(eq + 1).trim();
		if (/^[\w-]+(\/[\w-]+)?$/.test(key) && /^https?:\/\//.test(url)) {
			out.push([key, url]);
		}
	}
	return out;
}
