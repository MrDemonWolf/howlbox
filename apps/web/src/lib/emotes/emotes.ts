// Third-party emote resolution: 7TV + BTTV + FFZ, global + channel.
// All endpoints are public, no auth, browser-CORS safe (verified).
// Fetch + stale-if-error localStorage cache live in @/lib/cache.

import { cachedJson, ONE_HOUR_MS, SIX_HOURS_MS } from "@/lib/cache";

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

function addSevenTv(map: EmoteMap, emotes: SevenTvEmote[] | undefined) {
	for (const emote of emotes ?? []) {
		const host = emote.data?.host?.url;
		if (!emote.name || !host) {
			continue;
		}
		map.set(emote.name, {
			// host.url is protocol-relative ("//cdn.7tv.app/emote/{id}")
			url: `https:${host}/2x.webp`,
			// ActiveEmote.flags & 1 = zero-width overlay emote
			zeroWidth: ((emote.flags ?? 0) & 1) === 1,
		});
	}
}

interface BttvEmote {
	id?: string;
	code?: string;
}

function addBttv(map: EmoteMap, emotes: BttvEmote[] | undefined) {
	for (const emote of emotes ?? []) {
		if (!emote.id || !emote.code) {
			continue;
		}
		map.set(emote.code, {
			url: `https://cdn.betterttv.net/emote/${emote.id}/2x.webp`,
			zeroWidth: false,
		});
	}
}

interface FfzEmote {
	name?: string;
	urls?: Record<string, string>;
	animated?: Record<string, string> | null;
}

function addFfz(map: EmoteMap, emoticons: FfzEmote[] | undefined) {
	for (const emote of emoticons ?? []) {
		if (!emote.name) {
			continue;
		}
		// FFZ urls{} are always static PNG, even for animated emotes;
		// the animated{} key is ABSENT on static ones (test truthiness)
		const animated = emote.animated?.["2"] ?? emote.animated?.["1"];
		const still = emote.urls?.["2"] ?? emote.urls?.["1"];
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

export async function fetchEmoteMap(login: string): Promise<EmoteMap> {
	const map: EmoteMap = new Map();

	// First wave: the FFZ room (channel emotes + the twitch id 7TV/BTTV
	// need) alongside the three globals, which do not depend on the id.
	const [ffzRoom, sevenGlobal, bttvGlobal, ffzGlobal] = await Promise.all([
		cachedJson<FfzRoomResponse>(
			`ffz-room:${login}`,
			ONE_HOUR_MS,
			`https://api.frankerfacez.com/v1/room/${login}`,
		),
		cachedJson<SevenTvSet>(
			"7tv-global",
			SIX_HOURS_MS,
			"https://7tv.io/v3/emote-sets/global",
		),
		cachedJson<BttvEmote[]>(
			"bttv-global",
			SIX_HOURS_MS,
			"https://api.betterttv.net/3/cached/emotes/global",
		),
		cachedJson<FfzGlobalResponse>(
			"ffz-global",
			SIX_HOURS_MS,
			"https://api.frankerfacez.com/v1/set/global",
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
				)
			: null,
		twitchId
			? cachedJson<BttvUser>(
					`bttv-user:${twitchId}`,
					ONE_HOUR_MS,
					`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`,
				)
			: null,
	]);

	// order matters: globals first, channel emotes override on collision
	addSevenTv(map, sevenGlobal?.emotes);
	addBttv(map, bttvGlobal ?? undefined);

	// iterate default_sets ONLY; the response carries extra sets
	for (const setId of ffzGlobal?.default_sets ?? []) {
		addFfz(map, ffzGlobal?.sets?.[String(setId)]?.emoticons);
	}

	addSevenTv(map, sevenChannel?.emote_set?.emotes);

	// merge BOTH arrays or most channel emotes get dropped
	addBttv(map, bttvChannel?.channelEmotes);
	addBttv(map, bttvChannel?.sharedEmotes);

	if (ffzRoom?.room?.set !== undefined) {
		addFfz(map, ffzRoom.sets?.[String(ffzRoom.room.set)]?.emoticons);
	}

	return map;
}
