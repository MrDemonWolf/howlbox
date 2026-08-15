import { z } from "zod";

import { AVATAR_MODES, EVENT_KINDS } from "@/lib/twitch/types";

import {
	BG_MODES,
	FALSY_TOKENS,
	LOGIN_RE,
	MEDIA_MODES,
	normalizeEventList,
	normalizeLoginList,
	normalizeVariant,
	THEMES,
	TRUTHY_TOKENS,
} from "./config";

export type {
	AssetScale,
	BgMode,
	MediaMode,
	OverlayParams,
	Theme,
} from "./config";
export {
	assetScaleFor,
	BG_MODES,
	isValidLogin,
	MEDIA_MODES,
	normalizeEventList,
	normalizeLoginList,
	normalizeVariant,
	OVERLAY_DEFAULTS,
	THEME_VARIANTS,
	THEMES,
} from "./config";

// Every option rides in the OBS source URL. Invalid or missing values
// fall back to defaults instead of erroring: a typo in OBS must never
// produce a blank overlay.
// bare params count as on: ?hidebots == ?hidebots=true
const boolParam = z
	.preprocess((value) => {
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			return value === 1;
		}
		if (typeof value === "string") {
			return value === "" || TRUTHY_TOKENS.includes(value.toLowerCase());
		}
		return false;
	}, z.boolean())
	.catch(false);

// default-on switches: only an explicit off value disables
const boolParamOn = z
	.preprocess((value) => {
		if (value === undefined) {
			return true;
		}
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			return value !== 0;
		}
		if (typeof value === "string") {
			return !FALSY_TOKENS.includes(value.toLowerCase());
		}
		return true;
	}, z.boolean())
	.catch(true);

// Accepts both shapes this param arrives in. First load it is the raw
// comma string from the OBS URL. But TanStack Router re-serializes the
// validated search back into the address bar, so the NEXT parse sees the
// already-split array (?hide=["badbot"]) and would otherwise drop every
// login on the round trip.
const loginList = z
	.preprocess((value) => {
		if (typeof value === "string") {
			return normalizeLoginList(value);
		}
		if (Array.isArray(value)) {
			return normalizeLoginList(value.join(","));
		}
		return [];
	}, z.array(z.string()))
	.catch([]);

// TanStack Router's search parser JSON-types values: ?channel=123456
// arrives as a number, ?channel=true as a boolean, ?channel=null as
// null. All are valid Twitch login shapes, so stringify scalars back.
const scalarToString = (value: unknown) =>
	typeof value === "number" || typeof value === "boolean" || value === null
		? String(value)
		: value;

// and ?max=true would coerce to Number(true)=1; force it to fall back
const numberish = (value: unknown) =>
	typeof value === "boolean" ? Number.NaN : value;

const overlayParamsShape = z.object({
	channel: z
		.preprocess(
			scalarToString,
			z.string().trim().toLowerCase().regex(LOGIN_RE).optional(),
		)
		.catch(undefined),
	bg: z.enum(BG_MODES).catch("off"),
	theme: z.enum(THEMES).catch("wolf"),
	// theme-aware validation happens in the schema-level transform below,
	// where the resolved theme is in scope
	variant: z.preprocess(scalarToString, z.string()).catch(""),
	// text scale as a percentage of the theme's own --hb-font-size, so a
	// theme that ships smaller type (arcade) stays proportionally smaller
	size: z
		.preprocess(numberish, z.coerce.number().int().min(50).max(300))
		.catch(100),
	// emote multiplier for messages that are nothing but emotes. Half
	// steps, so not .int(); anything in between snaps to the nearest one.
	emotescale: z
		.preprocess(numberish, z.coerce.number().min(1).max(4))
		.catch(1)
		.transform((v) => Math.round(v * 2) / 2),
	max: z
		.preprocess(numberish, z.coerce.number().int().min(1).max(200))
		.catch(50),
	hidebots: boolParam,
	hide: loginList,
	// hold non-mod messages N seconds so moderation deletes land
	// before the overlay ever shows the message
	delay: z
		.preprocess(numberish, z.coerce.number().int().min(0).max(300))
		.catch(0),
	// drop messages starting with "!"
	hidecommands: boolParam,
	// featured mode: when set, ONLY these users are shown
	allow: loginList,
	badges: boolParamOn,
	timestamps: boolParam,
	animate: boolParamOn,
	// Animated art is separate from the message entrance animation.
	// The runtime also makes art static for a reduced-motion preference.
	media: z.enum(MEDIA_MODES).catch("animated"),
	// pronoun badges from pronouns.alejo.io (per-user third-party lookup)
	pronouns: boolParam,
	// sub/cheer/raid/first-chat rows; same string-or-array round trip
	// problem as loginList, since the router re-serializes the result
	events: z
		.preprocess(
			(value) => {
				if (typeof value === "string") {
					return normalizeEventList(value);
				}
				if (Array.isArray(value)) {
					return normalizeEventList(value.join(","));
				}
				return [];
			},
			z.array(z.enum(EVENT_KINDS)),
		)
		.catch([]),
	// profile pictures (per-user third-party lookup, so opt-in)
	avatars: z.enum(AVATAR_MODES).catch("off"),
	// auto-hide: fade each message out N seconds after it appears
	fade: z
		.preprocess(numberish, z.coerce.number().int().min(0).max(600))
		.catch(0),
	// custom badge art: "set/version=url" or "set=url" pairs, comma
	// separated; parsed/validated in lib/twitch/badges.ts
	badgeart: z.preprocess(scalarToString, z.string()).catch(""),
	// public GitHub gist of custom badge art (id or gist URL); fetched
	// and merged under the inline badgeart in lib/twitch/badges.ts
	badgegist: z.preprocess(scalarToString, z.string()).catch(""),
	// Re-fetch channel-scoped art every N minutes. Globals retain their TTL.
	refresh: z
		.preprocess(numberish, z.coerce.number().int().min(0).max(1440))
		.catch(0)
		.transform((v) => (v > 0 && v < 5 ? 5 : v)),
});

// The known-URL-keys list for parseOverlayUrl. Taken from the inner
// object because the transformed schema below has no .shape.
export const OVERLAY_PARAM_KEYS = Object.keys(overlayParamsShape.shape);

// variant is the one field whose validity depends on a sibling: it must
// be one of the resolved theme's declared variants, so the check runs
// after the object parse, when the theme has already settled.
export const overlayParamsSchema = overlayParamsShape.transform((params) => ({
	...params,
	variant: normalizeVariant(params.theme, params.variant),
}));
