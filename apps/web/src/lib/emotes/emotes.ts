// Third-party emote resolution: 7TV + BTTV + FFZ, global + channel.
// All endpoints are public, no auth, browser-CORS safe (verified).
// Fetch + stale-if-error localStorage cache live in @/lib/cache.

import { cachedJson, getJson } from "@/lib/cache";

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

// FFZ room 404s for channels that never used FFZ, so it cannot be the
// only login -> numeric id resolver
async function resolveTwitchId(login: string): Promise<string | null> {
	try {
		const users = (await getJson(
			`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`,
		)) as { id?: string }[];
		return users[0]?.id ?? null;
	} catch {
		return null;
	}
}

export async function fetchEmoteMap(login: string): Promise<EmoteMap> {
	const map: EmoteMap = new Map();

	// FFZ room gives channel emotes AND the twitch id 7TV/BTTV need
	const ffzRoom = await cachedJson(
		`ffz-room:${login}`,
		60 * 60_000,
		`https://api.frankerfacez.com/v1/room/${login}`,
	);
	const room = ffzRoom as {
		room?: { twitch_id?: number; set?: number };
		sets?: Record<string, { emoticons?: FfzEmote[] }>;
	} | null;
	const twitchId =
		room?.room?.twitch_id?.toString() ?? (await resolveTwitchId(login));

	const [sevenGlobal, bttvGlobal, ffzGlobal, sevenChannel, bttvChannel] =
		await Promise.all([
			cachedJson(
				"7tv-global",
				6 * 60 * 60_000,
				"https://7tv.io/v3/emote-sets/global",
			),
			cachedJson(
				"bttv-global",
				6 * 60 * 60_000,
				"https://api.betterttv.net/3/cached/emotes/global",
			),
			cachedJson(
				"ffz-global",
				6 * 60 * 60_000,
				"https://api.frankerfacez.com/v1/set/global",
			),
			twitchId
				? cachedJson(
						`7tv-user:${twitchId}`,
						60 * 60_000,
						`https://7tv.io/v3/users/twitch/${twitchId}`,
					)
				: null,
			twitchId
				? cachedJson(
						`bttv-user:${twitchId}`,
						60 * 60_000,
						`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`,
					)
				: null,
		]);

	// order matters: globals first, channel emotes override on collision
	addSevenTv(map, (sevenGlobal as { emotes?: SevenTvEmote[] } | null)?.emotes);
	addBttv(map, (bttvGlobal as BttvEmote[] | null) ?? undefined);

	const ffzGlobalSets = ffzGlobal as {
		default_sets?: number[];
		sets?: Record<string, { emoticons?: FfzEmote[] }>;
	} | null;
	// iterate default_sets ONLY; the response carries extra sets
	for (const setId of ffzGlobalSets?.default_sets ?? []) {
		addFfz(map, ffzGlobalSets?.sets?.[String(setId)]?.emoticons);
	}

	addSevenTv(
		map,
		(sevenChannel as { emote_set?: { emotes?: SevenTvEmote[] } } | null)
			?.emote_set?.emotes,
	);

	const bttvUser = bttvChannel as {
		channelEmotes?: BttvEmote[];
		sharedEmotes?: BttvEmote[];
	} | null;
	// merge BOTH arrays or most channel emotes get dropped
	addBttv(map, bttvUser?.channelEmotes);
	addBttv(map, bttvUser?.sharedEmotes);

	if (room?.room?.set !== undefined) {
		addFfz(map, room.sets?.[String(room.room.set)]?.emoticons);
	}

	return map;
}
