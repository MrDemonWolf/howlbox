// Badge images without secrets: the old badges.twitch.tv API is
// DNS-dead and Helix wants a token, so api.ivr.fi serves Helix-shaped
// badge JSON with open CORS. Channel response covers subscriber and bits
// art. Shared fetch + stale-if-error cache live in @/lib/cache.

import { cachedJson, ONE_HOUR_MS, SIX_HOURS_MS } from "@/lib/cache";
import {
	type AssetScale,
	type MediaFetchOptions,
	resolveMediaPreferences,
} from "@/lib/emotes/media";
import type { BadgeMap } from "@/lib/emotes/resolve";

const MAX_BADGE_SETS = 1_000;
const MAX_BADGE_VERSIONS = 20_000;

interface HelixBadgeVersion {
	id?: string;
	image_url_1x?: string;
	image_url_2x?: string;
	image_url_4x?: string;
}

interface HelixBadgeSet {
	set_id?: string;
	versions?: HelixBadgeVersion[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isShortString(value: unknown, max = 2_048): value is string {
	return typeof value === "string" && value.length <= max;
}

function isOptionalShortString(value: unknown, max?: number): boolean {
	return value === undefined || isShortString(value, max);
}

function isHelixBadgeVersion(value: unknown): value is HelixBadgeVersion {
	return (
		isRecord(value) &&
		isOptionalShortString(value.id, 128) &&
		isOptionalShortString(value.image_url_1x) &&
		isOptionalShortString(value.image_url_2x) &&
		isOptionalShortString(value.image_url_4x)
	);
}

function isHelixBadgeSets(value: unknown): value is HelixBadgeSet[] {
	if (!Array.isArray(value) || value.length > MAX_BADGE_SETS) {
		return false;
	}
	let versions = 0;
	for (const set of value) {
		if (
			!isRecord(set) ||
			!isOptionalShortString(set.set_id, 128) ||
			(set.versions !== undefined && !Array.isArray(set.versions))
		) {
			return false;
		}
		for (const version of set.versions ?? []) {
			versions++;
			if (versions > MAX_BADGE_VERSIONS || !isHelixBadgeVersion(version)) {
				return false;
			}
		}
	}
	return true;
}

function badgeUrl(
	version: HelixBadgeVersion,
	scale: AssetScale,
): string | null {
	const raw =
		scale === 3
			? (version.image_url_4x ?? version.image_url_2x ?? version.image_url_1x)
			: scale === 2
				? (version.image_url_2x ?? version.image_url_1x ?? version.image_url_4x)
				: (version.image_url_1x ??
					version.image_url_2x ??
					version.image_url_4x);
	return raw && isHttpsUrl(raw) ? raw : null;
}

function addSets(
	map: BadgeMap,
	sets: HelixBadgeSet[] | null,
	scale: AssetScale,
) {
	for (const set of sets ?? []) {
		if (!set.set_id) {
			continue;
		}
		for (const version of set.versions ?? []) {
			const url = badgeUrl(version, scale);
			if (version.id && url) {
				map.set(`${set.set_id}/${version.id}`, url);
			}
		}
	}
}

// forceChannel bypasses only the channel TTL. Global badges stay on their
// six-hour cache even when a source refreshes channel media frequently.
export async function fetchBadgeMap(
	login: string,
	options: MediaFetchOptions | boolean = {},
): Promise<BadgeMap> {
	const resolvedOptions =
		typeof options === "boolean" ? { forceChannel: options } : options;
	const { assetScale } = resolveMediaPreferences(resolvedOptions);
	const { forceChannel = false, signal } = resolvedOptions;
	const [globalResult, channelResult] = await Promise.allSettled([
		cachedJson<HelixBadgeSet[]>(
			"badges-global",
			SIX_HOURS_MS,
			"https://api.ivr.fi/v2/twitch/badges/global",
			{
				signal,
				validate: isHelixBadgeSets,
				cooldownKey: "ivr-badges-global",
			},
		),
		cachedJson<HelixBadgeSet[]>(
			`badges-channel:${login}`,
			ONE_HOUR_MS,
			`https://api.ivr.fi/v2/twitch/badges/channel?login=${encodeURIComponent(login)}`,
			{
				force: forceChannel,
				signal,
				validate: isHelixBadgeSets,
				cooldownKey: `ivr-badges-channel:${login}`,
			},
		),
	]);
	const global =
		globalResult.status === "fulfilled" ? globalResult.value : null;
	const channel =
		channelResult.status === "fulfilled" ? channelResult.value : null;
	const map: BadgeMap = new Map();
	addSets(map, global, assetScale);
	// Channel sets override global subscriber art.
	addSets(map, channel, assetScale);
	return map;
}

// Caps on user-supplied badge art. A chat overlay renders a handful of
// badge sets; anything past this is either a typo or an attempt to wedge
// the parser, so it is dropped rather than trusted.
const MAX_BADGE_ENTRIES = 200;
// A badge-art gist is a short key=url list. Refuse to parse a megabyte
// of attacker-controlled content before it can exhaust memory.
const MAX_GIST_BYTES = 64 * 1024;
const MAX_GIST_FILES = 16;

// A badge key is "<set>" or "<set>/<version>"; art must be an https
// image URL. Shared gate for the inline param and the gist file, so
// both drop the same junk. Never throws, same spirit as params.ts.
function isBadgeKey(key: string): boolean {
	return /^[\w-]+(\/[\w-]+)?$/.test(key);
}

// HTTPS only, and never a URL carrying embedded credentials.
function isHttpsUrl(url: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	return parsed.protocol === "https:" && !parsed.username && !parsed.password;
}

// Custom badge art from the ?badgeart param. Comma list of
// "<set>/<version>=<image url>" or "<set>=<image url>" pairs; a bare
// set key covers every version of that set.
export function parseCustomBadgeArt(raw: string): [string, string][] {
	const out: [string, string][] = [];
	for (const pair of raw.split(",")) {
		if (out.length >= MAX_BADGE_ENTRIES) {
			break;
		}
		const eq = pair.indexOf("=");
		if (eq <= 0) {
			continue;
		}
		const key = pair.slice(0, eq).trim();
		const url = pair.slice(eq + 1).trim();
		if (isBadgeKey(key) && isHttpsUrl(url)) {
			out.push([key, url]);
		}
	}
	return out;
}

// A gist file is either JSON ({ "set/version": "url" }) or the same
// set=url line format the inline param uses. Bad entries drop out.
export function parseGistBadgeArt(content: string): [string, string][] {
	if (content.length > MAX_GIST_BYTES) {
		return [];
	}
	const trimmed = content.trim();
	if (trimmed.startsWith("{")) {
		try {
			const obj = JSON.parse(trimmed) as Record<string, unknown>;
			const out: [string, string][] = [];
			for (const [key, url] of Object.entries(obj)) {
				if (out.length >= MAX_BADGE_ENTRIES) {
					break;
				}
				if (typeof url === "string" && isBadgeKey(key) && isHttpsUrl(url)) {
					out.push([key, url]);
				}
			}
			return out;
		} catch {
			// Not JSON after all: fall through to the line parser.
		}
	}
	return parseCustomBadgeArt(content.replace(/\r?\n/g, ","));
}

interface GistResponse {
	files?: Record<string, { content?: string } | null>;
}

function isGistResponse(value: unknown): value is GistResponse {
	if (!isRecord(value)) {
		return false;
	}
	if (value.files === undefined) {
		return true;
	}
	if (!isRecord(value.files)) {
		return false;
	}
	const files = Object.entries(value.files);
	if (files.length > MAX_GIST_FILES) {
		return false;
	}
	let totalBytes = 0;
	for (const [name, file] of files) {
		if (!isShortString(name, 256) || file === null) {
			continue;
		}
		if (
			!isRecord(file) ||
			!isOptionalShortString(file.content, MAX_GIST_BYTES)
		) {
			return false;
		}
		totalBytes += typeof file.content === "string" ? file.content.length : 0;
		if (totalBytes > MAX_GIST_BYTES) {
			return false;
		}
	}
	return true;
}

// Accept a full gist URL (gist.github.com or the raw host) or a bare
// id; pull the long hexadecimal id out of whatever the user pasted.
export function gistIdFrom(ref: string): string | null {
	return ref.trim().match(/[0-9a-f]{20,}/i)?.[0] ?? null;
}

// Custom badge art hosted in a public GitHub gist (?badgegist). Every
// file is parsed and merged. Bad ref or dead gist resolves to [].
export async function fetchGistBadgeArt(
	ref: string,
	options: Pick<MediaFetchOptions, "forceChannel" | "signal"> | boolean = {},
): Promise<[string, string][]> {
	const id = gistIdFrom(ref);
	if (!id) {
		return [];
	}
	const resolvedOptions =
		typeof options === "boolean" ? { forceChannel: options } : options;
	const res = await cachedJson<GistResponse>(
		`badge-gist:${id}`,
		ONE_HOUR_MS,
		`https://api.github.com/gists/${id}`,
		{
			force: resolvedOptions.forceChannel,
			signal: resolvedOptions.signal,
			validate: isGistResponse,
			cooldownKey: `github-gist:${id}`,
		},
	);
	const pairs: [string, string][] = [];
	for (const file of Object.values(res?.files ?? {})) {
		if (pairs.length >= MAX_BADGE_ENTRIES) {
			break;
		}
		if (file?.content) {
			pairs.push(...parseGistBadgeArt(file.content));
		}
	}
	return pairs.slice(0, MAX_BADGE_ENTRIES);
}
