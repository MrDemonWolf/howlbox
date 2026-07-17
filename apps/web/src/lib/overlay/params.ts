import { z } from "zod";

export const BG_MODES = ["off", "panel", "bubble"] as const;
export const THEMES = [
	"wolf",
	"glass",
	"terminal",
	"neon",
	"dark",
	"light",
	"contrast",
	"cozy",
	"nobox",
	"retro95",
	"arcade",
	"galaxy",
	"mocha",
] as const;

export type BgMode = (typeof BG_MODES)[number];
export type Theme = (typeof THEMES)[number];

// Resolved default for each non-empty param. Mirrors the schema's
// per-field .catch() fallbacks below, and is the shared source the
// config builder serializes against so the two cannot disagree.
export const OVERLAY_DEFAULTS = {
	bg: "off",
	theme: "wolf",
	max: 50,
	delay: 0,
	fade: 0,
	hidebots: false,
	hidecommands: false,
	timestamps: false,
	badges: true,
	animate: true,
} satisfies {
	bg: BgMode;
	theme: Theme;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
};

// One valid Twitch login: 1-25 chars of lowercase alnum/underscore.
const LOGIN_RE = /^[a-z0-9_]{1,25}$/;
// string tokens that read as on / off in a URL param
const TRUTHY_TOKENS = ["1", "true", "on", "yes"];
const FALSY_TOKENS = ["0", "false", "off", "no"];

// Split a comma list into valid, lowercased logins, dropping anything
// that is not a real Twitch login shape. Shared with the config
// builder so it and the overlay agree on what survives.
export function normalizeLoginList(raw: string): string[] {
	return raw
		.split(",")
		.map((login) => login.trim().toLowerCase())
		.filter((login) => LOGIN_RE.test(login));
}

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

const loginList = z
	.preprocess(
		(value) => (typeof value === "string" ? normalizeLoginList(value) : []),
		z.array(z.string()),
	)
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

export const overlayParamsSchema = z.object({
	channel: z
		.preprocess(
			scalarToString,
			z.string().trim().toLowerCase().regex(LOGIN_RE).optional(),
		)
		.catch(undefined),
	bg: z.enum(BG_MODES).catch("off"),
	theme: z.enum(THEMES).catch("wolf"),
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
	// auto-hide: fade each message out N seconds after it appears
	fade: z
		.preprocess(numberish, z.coerce.number().int().min(0).max(600))
		.catch(0),
});

export type OverlayParams = z.infer<typeof overlayParamsSchema>;
