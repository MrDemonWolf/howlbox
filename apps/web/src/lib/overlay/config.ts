import {
	type AvatarMode,
	type ChatEventKind,
	EVENT_KINDS,
} from "@/lib/twitch/types";

export const BG_MODES = ["off", "panel", "bubble"] as const;
export const MEDIA_MODES = ["animated", "static"] as const;
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
	"xp",
	"xbox",
	"arcade",
	"galaxy",
	"mocha",
] as const;

export type BgMode = (typeof BG_MODES)[number];
export type MediaMode = (typeof MEDIA_MODES)[number];
export type Theme = (typeof THEMES)[number];
export type AssetScale = 1 | 2 | 3;

export interface OverlayParams {
	channel?: string;
	bg: BgMode;
	theme: Theme;
	size: number;
	max: number;
	hidebots: boolean;
	hide: string[];
	delay: number;
	hidecommands: boolean;
	allow: string[];
	badges: boolean;
	timestamps: boolean;
	animate: boolean;
	media: MediaMode;
	pronouns: boolean;
	events: ChatEventKind[];
	avatars: AvatarMode;
	fade: number;
	badgeart: string;
	badgegist: string;
	refresh: number;
}

// Provider 1x art is sized for the default renderer at OBS DPR 1. Increase
// resolution only after the configured text scale outgrows that source art.
export function assetScaleFor(size: number): AssetScale {
	if (size <= 100) return 1;
	if (size <= 200) return 2;
	return 3;
}

// Shared defaults for the schema, direct OBS parser, URL serializer, and form.
export const OVERLAY_DEFAULTS = {
	bg: "off",
	theme: "wolf",
	size: 100,
	max: 50,
	delay: 0,
	fade: 0,
	hidebots: false,
	hidecommands: false,
	timestamps: false,
	badges: true,
	animate: true,
	media: "animated",
	badgeart: "",
	badgegist: "",
	refresh: 0,
	pronouns: false,
	events: [] as ChatEventKind[],
	avatars: "off",
} satisfies {
	bg: BgMode;
	theme: Theme;
	size: number;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
	media: MediaMode;
	badgeart: string;
	badgegist: string;
	refresh: number;
	pronouns: boolean;
	events: ChatEventKind[];
	avatars: AvatarMode;
};

export const LOGIN_RE = /^[a-z0-9_]{1,25}$/;
export const TRUTHY_TOKENS = ["1", "true", "on", "yes"];
export const FALSY_TOKENS = ["0", "false", "off", "no"];

export function isValidLogin(login: string): boolean {
	return LOGIN_RE.test(login);
}

export function normalizeLoginList(raw: string): string[] {
	return raw
		.split(",")
		.map((login) => login.trim().toLowerCase())
		.filter(isValidLogin);
}

export function normalizeEventList(raw: string): ChatEventKind[] {
	const tokens = raw.split(",").map((token) => token.trim().toLowerCase());
	if (tokens.includes("all")) {
		return [...EVENT_KINDS];
	}
	return EVENT_KINDS.filter((kind) => tokens.includes(kind));
}
