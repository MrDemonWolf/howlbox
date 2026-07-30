// Form model for the configurator: the editable Config shape, its
// defaults, and the pure conversions between it and the overlay URL
// schema. Kept apart from the components so the state math is readable
// and testable on its own.

import type { BgMode, MediaMode, Theme } from "@/lib/overlay/params";
import {
	normalizeLoginList,
	OVERLAY_DEFAULTS,
	type OverlayParams,
} from "@/lib/overlay/params";
import type { AvatarMode, ChatEventKind } from "@/lib/twitch/types";

export interface Config {
	channel: string;
	theme: Theme;
	bg: BgMode;
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
	pronouns: boolean;
	hide: string;
	allow: string;
	badgeart: string;
	badgegist: string;
	refresh: number;
	events: ChatEventKind[];
	avatars: AvatarMode;
}

// Form state. The scalar/toggle defaults come from the shared
// OVERLAY_DEFAULTS so they can't drift from the overlay; hide/allow are
// raw comma strings here, normalized only when the URL is built.
export const DEFAULTS: Config = {
	channel: "",
	theme: OVERLAY_DEFAULTS.theme,
	bg: OVERLAY_DEFAULTS.bg,
	size: OVERLAY_DEFAULTS.size,
	max: OVERLAY_DEFAULTS.max,
	delay: OVERLAY_DEFAULTS.delay,
	fade: OVERLAY_DEFAULTS.fade,
	hidebots: OVERLAY_DEFAULTS.hidebots,
	hidecommands: OVERLAY_DEFAULTS.hidecommands,
	timestamps: OVERLAY_DEFAULTS.timestamps,
	badges: OVERLAY_DEFAULTS.badges,
	animate: OVERLAY_DEFAULTS.animate,
	media: OVERLAY_DEFAULTS.media,
	pronouns: OVERLAY_DEFAULTS.pronouns,
	hide: "",
	allow: "",
	badgeart: OVERLAY_DEFAULTS.badgeart,
	badgegist: OVERLAY_DEFAULTS.badgegist,
	refresh: OVERLAY_DEFAULTS.refresh,
	events: OVERLAY_DEFAULTS.events,
	avatars: OVERLAY_DEFAULTS.avatars,
};

// The event toggles, in the order they appear in the form. One checkbox
// can cover several twurple events (a gift, a mass gift and a Prime
// upgrade are all "subs" as far as a streamer is concerned).
export const EVENT_TOGGLES: {
	kind: ChatEventKind;
	label: string;
	hint: string;
}[] = [
	{
		kind: "sub",
		label: "Subs, resubs and gifts",
		hint: "Including mass gifts and Prime upgrades.",
	},
	{ kind: "cheer", label: "Cheers", hint: "With the bits tier art." },
	{ kind: "raid", label: "Raids", hint: "Raider name and viewer count." },
	{
		kind: "first",
		label: "First-time chatters",
		hint: "Marks a first message, and returning chatters.",
	},
	{
		kind: "announce",
		label: "Announcements",
		hint: "The /announce highlight from mods.",
	},
];

export const AVATAR_OPTIONS: { value: AvatarMode; label: string }[] = [
	{ value: "off", label: "Off" },
	{ value: "all", label: "Everyone" },
	{ value: "subs", label: "Subscribers only" },
];

// The ui package ships dense 32px square fields; the site scale is a
// 44px rounded control. One constant so every field matches the buttons
// (tailwind-merge lets these win over the primitive's own classes).
export const FIELD = "h-11 rounded-[0.7rem] px-3 text-sm";

// Named text-size stops. The slider still allows anything in range;
// these are the one-click answers for "make it bigger".
export const SIZE_PRESETS = [
	{ label: "S", value: 85 },
	{ label: "M", value: 100 },
	{ label: "L", value: 125 },
	{ label: "XL", value: 160 },
];

// Clamp a typed number into [min, max]. A valid in-range 0 must survive
// (Number(raw) || fallback would turn a legitimate 0 into the fallback,
// so ?max=0 snapped to 50 instead of clamping to the min of 1); only a
// non-numeric draft falls back.
export function clampNumber(
	raw: string,
	min: number,
	max: number,
	fallback: number,
) {
	const n = Number(raw);
	return Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback));
}

// Config -> the object buildOverlayUrl serializes. hide/allow are
// normalized to login arrays here; the trimmed channel is passed in.
export function configToOverlay(config: Config, cleanChannel: string) {
	return {
		channel: cleanChannel,
		theme: config.theme,
		bg: config.bg,
		size: config.size,
		max: config.max,
		delay: config.delay,
		fade: config.fade,
		hidebots: config.hidebots,
		hidecommands: config.hidecommands,
		timestamps: config.timestamps,
		badges: config.badges,
		animate: config.animate,
		media: config.media,
		pronouns: config.pronouns,
		hide: normalizeLoginList(config.hide),
		allow: normalizeLoginList(config.allow),
		badgeart: config.badgeart.trim(),
		badgegist: config.badgegist.trim(),
		refresh: config.refresh,
		events: config.events,
		avatars: config.avatars,
	};
}

// Parsed overlay params -> form Config. Anything the schema rejected has
// already landed on its default, so a stale or hand-edited link still
// loads; hide/allow rejoin into the comma strings the inputs edit.
export function parsedToConfig(parsed: OverlayParams): Config {
	return {
		channel: parsed.channel ?? "",
		theme: parsed.theme,
		bg: parsed.bg,
		size: parsed.size,
		max: parsed.max,
		delay: parsed.delay,
		fade: parsed.fade,
		hidebots: parsed.hidebots,
		hidecommands: parsed.hidecommands,
		timestamps: parsed.timestamps,
		badges: parsed.badges,
		animate: parsed.animate,
		media: parsed.media,
		pronouns: parsed.pronouns,
		hide: parsed.hide.join(", "),
		allow: parsed.allow.join(", "),
		badgeart: parsed.badgeart,
		badgegist: parsed.badgegist,
		refresh: parsed.refresh,
		events: parsed.events,
		avatars: parsed.avatars,
	};
}

// setState helper signature shared by the section components.
export type SetConfig = <K extends keyof Config>(
	key: K,
	value: Config[K],
) => void;
