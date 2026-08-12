// Third-party emote resolution: 7TV + BTTV + FFZ, global + channel.
// All endpoints are public, no auth, browser-CORS safe (verified).
// Fetch + stale-if-error localStorage cache live in @/lib/cache.

import { cachedJson, ONE_HOUR_MS, SIX_HOURS_MS } from "@/lib/cache";

import { type AssetTier, type TierVariants, tierVariants } from "./asset-tier";

export interface ThirdPartyEmote {
	url: string;
	zeroWidth: boolean;
}

export type EmoteMap = Map<string, ThirdPartyEmote>;

interface SevenTvEmote {
	name?: string;
	flags?: number;
	data?: {
		host?: { url?: string };
		listed?: boolean;
	};
}

function addSevenTv(
	map: EmoteMap,
	emotes: SevenTvEmote[] | undefined,
	variant: string,
) {
	for (const emote of emotes ?? []) {
		const host = emote.data?.host?.url;
		if (!emote.name || !host) {
			continue;
		}
		map.set(emote.name, {
			// host.url is protocol-relative ("//cdn.7tv.app/emote/{id}")
			url: `https:${host}/${variant}`,
			// ActiveEmote.flags & 1 = zero-width overlay emote
			zeroWidth: ((emote.flags ?? 0) & 1) === 1,
		});
	}
}

interface BttvEmote {
	id?: string;
	code?: string;
}

function addBttv(
	map: EmoteMap,
	emotes: BttvEmote[] | undefined,
	variant: string,
) {
	for (const emote of emotes ?? []) {
		if (!emote.id || !emote.code) {
			continue;
		}
		map.set(emote.code, {
			url: `https://cdn.betterttv.net/emote/${emote.id}/${variant}`,
			zeroWidth: false,
		});
	}
}

interface FfzEmote {
	name?: string;
	urls?: Record<string, string>;
	animated?: Record<string, string> | null;
}

function addFfz(
	map: EmoteMap,
	emoticons: FfzEmote[] | undefined,
	key: TierVariants["ffz"],
) {
	for (const emote of emoticons ?? []) {
		if (!emote.name) {
			continue;
		}
		// FFZ urls{} are always static PNG, even for animated emotes;
		// the animated{} key is ABSENT on static ones (test truthiness).
		// The ladder collapses to the old "2" then "1" when key is "2".
		const animated =
			emote.animated?.[key] ?? emote.animated?.["2"] ?? emote.animated?.["1"];
		const still = emote.urls?.[key] ?? emote.urls?.["2"] ?? emote.urls?.["1"];
		const url = animated ?? still;
		if (url) {
			map.set(emote.name, { url, zeroWidth: false });
		}
	}
}

interface FfzRoomResponse {
	room?: { twitch_id?: number; set?: number };
	sets?: Record<string, { emoticons?: FfzEmote[] }>;
}

interface FfzGlobalResponse {
	default_sets?: number[];
	sets?: Record<string, { emoticons?: FfzEmote[] }>;
}

interface SevenTvSet {
	emotes?: SevenTvEmote[];
}

interface SevenTvUser {
	emote_set?: { emotes?: SevenTvEmote[] };
}

interface BttvUser {
	channelEmotes?: BttvEmote[];
	sharedEmotes?: BttvEmote[];
}

// FFZ room 404s for channels that never used FFZ, so it cannot be the
// only login -> numeric id resolver. Cached: the mapping never changes.
async function resolveTwitchId(login: string): Promise<string | null> {
	const users = await cachedJson<{ id?: string }[]>(
		`twitch-id:${login}`,
		SIX_HOURS_MS,
		`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`,
	);
	return users?.[0]?.id ?? null;
}

// force bypasses the cache TTLs (used by the ?refresh param) so a
// mid-stream emote add shows up without an overlay reload. tier picks
// the CDN variant every URL below is built at; it applies after the
// cache reads and no request carries a size, so changing it rebuilds
// the map from localStorage with no extra network.
export async function fetchEmoteMap(
	login: string,
	force = false,
	tier: AssetTier = "standard",
): Promise<EmoteMap> {
	const map: EmoteMap = new Map();
	const variant = tierVariants(tier);

	// First wave: the FFZ room (channel emotes + the twitch id 7TV/BTTV
	// need) alongside the three globals, which do not depend on the id.
	const [ffzRoom, sevenGlobal, bttvGlobal, ffzGlobal] = await Promise.all([
		cachedJson<FfzRoomResponse>(
			`ffz-room:${login}`,
			ONE_HOUR_MS,
			`https://api.frankerfacez.com/v1/room/${login}`,
			force,
		),
		cachedJson<SevenTvSet>(
			"7tv-global",
			SIX_HOURS_MS,
			"https://7tv.io/v3/emote-sets/global",
			force,
		),
		cachedJson<BttvEmote[]>(
			"bttv-global",
			SIX_HOURS_MS,
			"https://api.betterttv.net/3/cached/emotes/global",
			force,
		),
		cachedJson<FfzGlobalResponse>(
			"ffz-global",
			SIX_HOURS_MS,
			"https://api.frankerfacez.com/v1/set/global",
			force,
		),
	]);

	const twitchId =
		ffzRoom?.room?.twitch_id?.toString() ?? (await resolveTwitchId(login));

	// Second wave: the per-channel 7TV/BTTV sets, which need the id.
	const [sevenChannel, bttvChannel] = await Promise.all([
		twitchId
			? cachedJson<SevenTvUser>(
					`7tv-user:${twitchId}`,
					ONE_HOUR_MS,
					`https://7tv.io/v3/users/twitch/${twitchId}`,
					force,
				)
			: null,
		twitchId
			? cachedJson<BttvUser>(
					`bttv-user:${twitchId}`,
					ONE_HOUR_MS,
					`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`,
					force,
				)
			: null,
	]);

	// order matters: globals first, channel emotes override on collision
	addSevenTv(map, sevenGlobal?.emotes, variant.sevenTv);
	addBttv(map, bttvGlobal ?? undefined, variant.bttv);

	// iterate default_sets ONLY; the response carries extra sets
	for (const setId of ffzGlobal?.default_sets ?? []) {
		addFfz(map, ffzGlobal?.sets?.[String(setId)]?.emoticons, variant.ffz);
	}

	addSevenTv(map, sevenChannel?.emote_set?.emotes, variant.sevenTv);

	// merge BOTH arrays or most channel emotes get dropped
	addBttv(map, bttvChannel?.channelEmotes, variant.bttv);
	addBttv(map, bttvChannel?.sharedEmotes, variant.bttv);

	if (ffzRoom?.room?.set !== undefined) {
		addFfz(
			map,
			ffzRoom.sets?.[String(ffzRoom.room.set)]?.emoticons,
			variant.ffz,
		);
	}

	return map;
}
