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

// A badge key is "<set>" or "<set>/<version>"; art must be an http(s)
// image URL. Shared gate for the inline param and the gist file, so
// both drop the same junk. Never throws, same spirit as params.ts.
function isBadgeKey(key: string): boolean {
	return /^[\w-]+(\/[\w-]+)?$/.test(key);
}
function isHttpUrl(url: string): boolean {
	return /^https?:\/\//.test(url);
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
		if (isBadgeKey(key) && isHttpUrl(url)) {
			out.push([key, url]);
		}
	}
	return out;
}

// A gist file is either JSON ({ "set/version": "url" }) or the same
// set=url line format the inline param uses. Bad entries drop out.
export function parseGistBadgeArt(content: string): [string, string][] {
	const trimmed = content.trim();
	if (trimmed.startsWith("{")) {
		try {
			const obj = JSON.parse(trimmed) as Record<string, unknown>;
			const out: [string, string][] = [];
			for (const [key, url] of Object.entries(obj)) {
				if (typeof url === "string" && isBadgeKey(key) && isHttpUrl(url)) {
					out.push([key, url]);
				}
			}
			return out;
		} catch {
			// not JSON after all: fall through to the line parser
		}
	}
	// newlines are the natural separator in a gist; the inline parser
	// splits on commas, so bridge the two
	return parseCustomBadgeArt(content.replace(/\r?\n/g, ","));
}

interface GistResponse {
	files?: Record<string, { content?: string } | null>;
}

// Accept a full gist URL (gist.github.com or the raw host) or a bare
// id; pull the 32-char hex id out of whatever the user pasted.
export function gistIdFrom(ref: string): string | null {
	return ref.trim().match(/[0-9a-f]{20,}/i)?.[0] ?? null;
}

// Custom badge art hosted in a public GitHub gist (?badgegist). The
// gist API needs no token for public gists and sends open CORS, so it
// keeps HowlBox client-only. Every file in the gist is parsed and
// merged. Bad ref or dead gist resolves to [], never fatal.
// ponytail: unauthenticated gist API is 60 req/hr/IP. ?refresh has a
// 5-minute floor, so a gist refetches at most 12x/hr, well under the
// ceiling even on a shared IP. Document the ceiling rather than add auth.
export async function fetchGistBadgeArt(
	ref: string,
	force = false,
): Promise<[string, string][]> {
	const id = gistIdFrom(ref);
	if (!id) {
		return [];
	}
	const res = await cachedJson<GistResponse>(
		`badge-gist:${id}`,
		ONE_HOUR_MS,
		`https://api.github.com/gists/${id}`,
		force,
	);
	const pairs: [string, string][] = [];
	for (const file of Object.values(res?.files ?? {})) {
		if (file?.content) {
			pairs.push(...parseGistBadgeArt(file.content));
		}
	}
	return pairs;
}
