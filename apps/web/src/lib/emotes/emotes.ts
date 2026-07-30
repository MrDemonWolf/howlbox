// Third-party emote resolution: 7TV + BTTV + FFZ, global + channel.
// All endpoints are public, no auth, browser-CORS safe (verified).
// Fetch + stale-if-error localStorage cache live in @/lib/cache.

import { cachedJson, ONE_HOUR_MS, SIX_HOURS_MS } from "@/lib/cache";

import {
	type AssetScale,
	type MediaFetchOptions,
	resolveMediaPreferences,
} from "./media";

export interface ThirdPartyEmote {
	url: string;
	zeroWidth: boolean;
}

export type EmoteMap = Map<string, ThirdPartyEmote>;

const MAX_EMOTES_PER_PAYLOAD = 20_000;
const MAX_SETS_PER_PAYLOAD = 2_000;
const MAX_HOST_FILES = 32;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isShortString(value: unknown, max = 2_048): value is string {
	return typeof value === "string" && value.length <= max;
}

function isOptionalShortString(value: unknown, max?: number): boolean {
	return value === undefined || isShortString(value, max);
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return (
		isRecord(value) &&
		Object.keys(value).length <= 16 &&
		Object.values(value).every((item) => isShortString(item))
	);
}

function normalizedHttpsUrl(raw: string): string | null {
	try {
		const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
		return url.protocol === "https:" && !url.username && !url.password
			? url.href
			: null;
	} catch {
		return null;
	}
}

interface SevenTvFile {
	name?: string;
	static_name?: string;
	frame_count?: number;
}

interface SevenTvEmote {
	name?: string;
	flags?: number;
	data?: {
		host?: { url?: string; files?: SevenTvFile[] };
		listed?: boolean;
	};
}

function isSevenTvFile(value: unknown): value is SevenTvFile {
	return (
		isRecord(value) &&
		isOptionalShortString(value.name, 128) &&
		isOptionalShortString(value.static_name, 128) &&
		(value.frame_count === undefined ||
			(typeof value.frame_count === "number" && value.frame_count >= 0))
	);
}

function isSevenTvEmote(value: unknown): value is SevenTvEmote {
	if (!isRecord(value)) {
		return false;
	}
	if (
		!isOptionalShortString(value.name, 256) ||
		(value.flags !== undefined && typeof value.flags !== "number")
	) {
		return false;
	}
	if (value.data === undefined) {
		return true;
	}
	if (!isRecord(value.data)) {
		return false;
	}
	const host = value.data.host;
	return (
		host === undefined ||
		(isRecord(host) &&
			isOptionalShortString(host.url) &&
			(host.files === undefined ||
				(Array.isArray(host.files) &&
					host.files.length <= MAX_HOST_FILES &&
					host.files.every(isSevenTvFile))))
	);
}

interface SevenTvSet {
	emotes?: SevenTvEmote[];
}

interface SevenTvUser {
	emote_set?: SevenTvSet;
}

function isSevenTvSet(value: unknown): value is SevenTvSet {
	return (
		isRecord(value) &&
		(value.emotes === undefined ||
			(Array.isArray(value.emotes) &&
				value.emotes.length <= MAX_EMOTES_PER_PAYLOAD &&
				value.emotes.every(isSevenTvEmote)))
	);
}

function isSevenTvUser(value: unknown): value is SevenTvUser {
	return (
		isRecord(value) &&
		(value.emote_set === undefined || isSevenTvSet(value.emote_set))
	);
}

function sevenTvFileName(
	files: SevenTvFile[] | undefined,
	scale: AssetScale,
	staticMedia: boolean,
): string | null {
	const prefix = `${scale}x`;
	for (const file of files ?? []) {
		const name = staticMedia ? file.static_name : file.name;
		if (
			name?.startsWith(prefix) &&
			name.endsWith(".webp") &&
			/^[a-zA-Z0-9_.-]+$/.test(name)
		) {
			return name;
		}
	}
	// Static emotes sometimes expose no separate static_name because their
	// ordinary file is already one frame.
	if (staticMedia) {
		for (const file of files ?? []) {
			if (
				file.frame_count === 1 &&
				file.name?.startsWith(prefix) &&
				file.name.endsWith(".webp") &&
				/^[a-zA-Z0-9_.-]+$/.test(file.name)
			) {
				return file.name;
			}
		}
	}
	return null;
}

function addSevenTv(
	map: EmoteMap,
	emotes: SevenTvEmote[] | undefined,
	scale: AssetScale,
	staticMedia: boolean,
) {
	for (const emote of emotes ?? []) {
		const host = emote.data?.host;
		if (!emote.name || !host?.url) {
			continue;
		}
		const base = normalizedHttpsUrl(host.url);
		if (!base) {
			continue;
		}
		const file = sevenTvFileName(host.files, scale, staticMedia);
		// Older cached 7TV payloads may predate host.files. The CDN uses the
		// same static suffix as current file metadata, so preserve the mode.
		const url = normalizedHttpsUrl(
			`${base.replace(/\/$/, "")}/${file ?? `${scale}x${staticMedia ? "_static" : ""}.webp`}`,
		);
		if (!url) {
			continue;
		}
		map.set(emote.name, {
			url,
			// ActiveEmote.flags & 1 = zero-width overlay emote
			zeroWidth: ((emote.flags ?? 0) & 1) === 1,
		});
	}
}

interface BttvEmote {
	id?: string;
	code?: string;
}

function isBttvEmote(value: unknown): value is BttvEmote {
	return (
		isRecord(value) &&
		isOptionalShortString(value.id, 128) &&
		isOptionalShortString(value.code, 256)
	);
}

function isBttvEmoteArray(value: unknown): value is BttvEmote[] {
	return (
		Array.isArray(value) &&
		value.length <= MAX_EMOTES_PER_PAYLOAD &&
		value.every(isBttvEmote)
	);
}

function addBttv(
	map: EmoteMap,
	emotes: BttvEmote[] | undefined,
	scale: AssetScale,
	staticMedia: boolean,
) {
	for (const emote of emotes ?? []) {
		if (!emote.id || !emote.code || !/^[a-zA-Z0-9]+$/.test(emote.id)) {
			continue;
		}
		map.set(emote.code, {
			url: `https://cdn.betterttv.net/emote/${emote.id}/${scale}x.${staticMedia ? "png" : "webp"}`,
			zeroWidth: false,
		});
	}
}

interface FfzEmote {
	name?: string;
	urls?: Record<string, string>;
	animated?: Record<string, string> | null;
}

function isFfzEmote(value: unknown): value is FfzEmote {
	return (
		isRecord(value) &&
		isOptionalShortString(value.name, 256) &&
		(value.urls === undefined || isStringRecord(value.urls)) &&
		(value.animated === undefined ||
			value.animated === null ||
			isStringRecord(value.animated))
	);
}

function isFfzEmoteArray(value: unknown): value is FfzEmote[] {
	return (
		Array.isArray(value) &&
		value.length <= MAX_EMOTES_PER_PAYLOAD &&
		value.every(isFfzEmote)
	);
}

function ffzScaleKeys(scale: AssetScale): string[] {
	if (scale === 3) {
		return ["4", "2", "1"];
	}
	return scale === 2 ? ["2", "1", "4"] : ["1", "2", "4"];
}

function firstFfzUrl(
	urls: Record<string, string> | null | undefined,
	scale: AssetScale,
): string | null {
	for (const key of ffzScaleKeys(scale)) {
		const raw = urls?.[key];
		if (raw) {
			const url = normalizedHttpsUrl(raw);
			if (url) {
				return url;
			}
		}
	}
	return null;
}

function addFfz(
	map: EmoteMap,
	emoticons: FfzEmote[] | undefined,
	scale: AssetScale,
	staticMedia: boolean,
) {
	for (const emote of emoticons ?? []) {
		if (!emote.name) {
			continue;
		}
		const animated = staticMedia ? null : firstFfzUrl(emote.animated, scale);
		const url = animated ?? firstFfzUrl(emote.urls, scale);
		if (url) {
			map.set(emote.name, { url, zeroWidth: false });
		}
	}
}

interface FfzSet {
	emoticons?: FfzEmote[];
}

interface FfzRoomResponse {
	room?: { twitch_id?: number; set?: number };
	sets?: Record<string, FfzSet>;
}

interface FfzGlobalResponse {
	default_sets?: number[];
	sets?: Record<string, FfzSet>;
}

function isFfzSet(value: unknown): value is FfzSet {
	return (
		isRecord(value) &&
		(value.emoticons === undefined || isFfzEmoteArray(value.emoticons))
	);
}

function isFfzSets(value: unknown): value is Record<string, FfzSet> {
	return (
		isRecord(value) &&
		Object.keys(value).length <= MAX_SETS_PER_PAYLOAD &&
		Object.values(value).every(isFfzSet)
	);
}

function isFfzRoomResponse(value: unknown): value is FfzRoomResponse {
	if (!isRecord(value)) {
		return false;
	}
	const room = value.room;
	return (
		(room === undefined ||
			(isRecord(room) &&
				(room.twitch_id === undefined || typeof room.twitch_id === "number") &&
				(room.set === undefined || typeof room.set === "number"))) &&
		(value.sets === undefined || isFfzSets(value.sets))
	);
}

function isFfzGlobalResponse(value: unknown): value is FfzGlobalResponse {
	return (
		isRecord(value) &&
		(value.default_sets === undefined ||
			(Array.isArray(value.default_sets) &&
				value.default_sets.length <= MAX_SETS_PER_PAYLOAD &&
				value.default_sets.every((id) => typeof id === "number"))) &&
		(value.sets === undefined || isFfzSets(value.sets))
	);
}

interface BttvUser {
	channelEmotes?: BttvEmote[];
	sharedEmotes?: BttvEmote[];
}

function isBttvUser(value: unknown): value is BttvUser {
	return (
		isRecord(value) &&
		(value.channelEmotes === undefined ||
			isBttvEmoteArray(value.channelEmotes)) &&
		(value.sharedEmotes === undefined || isBttvEmoteArray(value.sharedEmotes))
	);
}

interface IvrUserId {
	id?: string;
}

function isIvrUserIds(value: unknown): value is IvrUserId[] {
	return (
		Array.isArray(value) &&
		value.length <= 100 &&
		value.every((item) => isRecord(item) && isOptionalShortString(item.id, 64))
	);
}

async function resolveTwitchId(
	login: string,
	signal?: AbortSignal,
): Promise<string | null> {
	const users = await cachedJson<IvrUserId[]>(
		`twitch-id:${login}`,
		SIX_HOURS_MS,
		`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`,
		{
			signal,
			validate: isIvrUserIds,
			cooldownKey: `ivr-user:${login}`,
		},
	);
	return users?.[0]?.id ?? null;
}

function settledValue<T>(result: PromiseSettledResult<T | null>): T | null {
	return result.status === "fulfilled" ? result.value : null;
}

// forceChannel bypasses only per-channel TTLs. Global provider sets keep
// their six-hour cache even when the overlay asks for frequent refreshes.
export async function fetchEmoteMap(
	login: string,
	options: MediaFetchOptions | boolean = {},
): Promise<EmoteMap> {
	const resolvedOptions =
		typeof options === "boolean" ? { forceChannel: options } : options;
	const { assetScale, staticMedia } = resolveMediaPreferences(resolvedOptions);
	const { forceChannel = false, signal } = resolvedOptions;
	const map: EmoteMap = new Map();

	const firstWave = await Promise.allSettled([
		cachedJson<FfzRoomResponse>(
			`ffz-room:${login}`,
			ONE_HOUR_MS,
			`https://api.frankerfacez.com/v1/room/${login}`,
			{
				force: forceChannel,
				signal,
				validate: isFfzRoomResponse,
				cooldownKey: `ffz-room:${login}`,
			},
		),
		cachedJson<SevenTvSet>(
			"7tv-global",
			SIX_HOURS_MS,
			"https://7tv.io/v3/emote-sets/global",
			{
				signal,
				validate: isSevenTvSet,
				cooldownKey: "7tv-global",
			},
		),
		cachedJson<BttvEmote[]>(
			"bttv-global",
			SIX_HOURS_MS,
			"https://api.betterttv.net/3/cached/emotes/global",
			{
				signal,
				validate: isBttvEmoteArray,
				cooldownKey: "bttv-global",
			},
		),
		cachedJson<FfzGlobalResponse>(
			"ffz-global",
			SIX_HOURS_MS,
			"https://api.frankerfacez.com/v1/set/global",
			{
				signal,
				validate: isFfzGlobalResponse,
				cooldownKey: "ffz-global",
			},
		),
	]);
	const ffzRoom = settledValue(firstWave[0]);
	const sevenGlobal = settledValue(firstWave[1]);
	const bttvGlobal = settledValue(firstWave[2]);
	const ffzGlobal = settledValue(firstWave[3]);

	const twitchId =
		ffzRoom?.room?.twitch_id?.toString() ??
		(await resolveTwitchId(login, signal));

	const secondWave = await Promise.allSettled([
		twitchId
			? cachedJson<SevenTvUser>(
					`7tv-user:${twitchId}`,
					ONE_HOUR_MS,
					`https://7tv.io/v3/users/twitch/${twitchId}`,
					{
						force: forceChannel,
						signal,
						validate: isSevenTvUser,
						cooldownKey: `7tv-user:${twitchId}`,
					},
				)
			: Promise.resolve(null),
		twitchId
			? cachedJson<BttvUser>(
					`bttv-user:${twitchId}`,
					ONE_HOUR_MS,
					`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`,
					{
						force: forceChannel,
						signal,
						validate: isBttvUser,
						cooldownKey: `bttv-user:${twitchId}`,
					},
				)
			: Promise.resolve(null),
	]);
	const sevenChannel = settledValue(secondWave[0]);
	const bttvChannel = settledValue(secondWave[1]);

	// Order matters: globals first, channel emotes override on collision.
	addSevenTv(map, sevenGlobal?.emotes, assetScale, staticMedia);
	addBttv(map, bttvGlobal ?? undefined, assetScale, staticMedia);

	for (const setId of ffzGlobal?.default_sets ?? []) {
		addFfz(
			map,
			ffzGlobal?.sets?.[String(setId)]?.emoticons,
			assetScale,
			staticMedia,
		);
	}

	addSevenTv(map, sevenChannel?.emote_set?.emotes, assetScale, staticMedia);
	addBttv(map, bttvChannel?.channelEmotes, assetScale, staticMedia);
	addBttv(map, bttvChannel?.sharedEmotes, assetScale, staticMedia);

	if (ffzRoom?.room?.set !== undefined) {
		addFfz(
			map,
			ffzRoom.sets?.[String(ffzRoom.room.set)]?.emoticons,
			assetScale,
			staticMedia,
		);
	}

	return map;
}
