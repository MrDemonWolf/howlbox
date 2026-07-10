// Badge images without secrets: the old badges.twitch.tv API is
// DNS-dead and Helix wants a token, so api.ivr.fi serves Helix-shaped
// badge JSON with open CORS (verified live). Channel response covers
// per-channel subscriber/bits art. Shared fetch + cache: @/lib/cache.

import { cachedJson } from "@/lib/cache";
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
