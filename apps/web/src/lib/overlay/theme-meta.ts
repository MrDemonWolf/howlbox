import type { BgMode, THEME_VARIANTS, Theme } from "@/lib/overlay/params";

// The four families the pickers, wall and docs group by. Picker order
// comes from FAMILY_ORDER, not the THEMES enum, so new enum values can
// append (additive URL contract) while still displaying next to their
// relatives.
export const FAMILY_ORDER = ["clean", "gamer", "cozy", "retro"] as const;
export type ThemeFamily = (typeof FAMILY_ORDER)[number];

export const FAMILY_LABEL: Record<ThemeFamily, string> = {
	clean: "Clean",
	gamer: "Gamer",
	cozy: "Cozy",
	retro: "Retro",
};

export const THEME_FAMILY: Record<Theme, ThemeFamily> = {
	wolf: "clean",
	glass: "clean",
	terminal: "retro",
	neon: "gamer",
	dark: "clean",
	light: "clean",
	contrast: "clean",
	cozy: "cozy",
	nobox: "clean",
	retro95: "retro",
	xp: "retro",
	xbox: "gamer",
	arcade: "retro",
	galaxy: "gamer",
	mocha: "cozy",
	gameboy: "retro",
	vhs: "retro",
	vapor: "retro",
};

// Per-variant picker metadata, typed off THEME_VARIANTS so a declared
// variant cannot ship without a label and swatch.
type VariantMeta = {
	[T in Theme]: Record<(typeof THEME_VARIANTS)[T][number], string>;
};

export const VARIANT_LABEL: VariantMeta = {
	wolf: {},
	glass: {},
	terminal: {},
	neon: {},
	dark: {},
	light: {},
	contrast: {},
	cozy: {},
	nobox: {},
	retro95: {},
	xp: {},
	xbox: {},
	arcade: {},
	galaxy: {},
	mocha: {},
	gameboy: { pocket: "Pocket", virtual: "Virtual Boy" },
	vhs: {},
	vapor: {},
};

export const VARIANT_SWATCH: VariantMeta = {
	wolf: {},
	glass: {},
	terminal: {},
	neon: {},
	dark: {},
	light: {},
	contrast: {},
	cozy: {},
	nobox: {},
	retro95: {},
	xp: {},
	xbox: {},
	arcade: {},
	galaxy: {},
	mocha: {},
	gameboy: {
		pocket: "linear-gradient(135deg,#b8b8a8 60%,#20201a)",
		virtual: "linear-gradient(135deg,#0a0000 55%,#ff2a2a)",
	},
	vhs: {},
	vapor: {},
};

// swatch gradient per theme so pickers/gallery read at a glance
export const THEME_SWATCH: Record<Theme, string> = {
	wolf: "linear-gradient(135deg,#132856,#091533 60%,#00ACED)",
	glass: "linear-gradient(135deg,#e8e8ee,#3a3d48)",
	terminal: "linear-gradient(135deg,#06130a,#4af680)",
	neon: "linear-gradient(135deg,#2c104e,#ff2db4)",
	dark: "linear-gradient(135deg,#1a1a1e,#4a4a52)",
	light: "linear-gradient(135deg,#ffffff,#c9d2e0)",
	contrast: "linear-gradient(135deg,#000000 55%,#ffffff 55%)",
	cozy: "linear-gradient(135deg,#ffe2f0,#e4dcff)",
	nobox: "linear-gradient(135deg,#0e1116,#ffffff)",
	retro95: "linear-gradient(135deg,#c0c0c0 65%,#000080)",
	xp: "linear-gradient(135deg,#f5f3e4 55%,#0855dd)",
	xbox: "linear-gradient(135deg,#1b201b,#107c10)",
	arcade: "linear-gradient(135deg,#140e2e,#ffd23f)",
	galaxy: "linear-gradient(135deg,#582c8a,#0a0a24)",
	mocha: "linear-gradient(135deg,#f3e8da,#8a5a3b)",
	gameboy: "linear-gradient(135deg,#9bbc0f 60%,#0f380f)",
	vhs: "linear-gradient(135deg,#101012 65%,#ff4040)",
	vapor: "linear-gradient(135deg,#a4386e,#1e165c 60%,#64f0ff)",
};

// human labels for the gallery/pickers (enum values stay the URL contract)
export const THEME_LABEL: Record<Theme, string> = {
	wolf: "Wolf Glass",
	glass: "Liquid Glass",
	terminal: "CRT Terminal",
	neon: "Synthwave Neon",
	dark: "Midnight",
	light: "Daylight",
	contrast: "High Contrast",
	cozy: "Kawaii Pastel",
	nobox: "Bare Text",
	retro95: "Windows 95",
	xp: "Windows XP",
	xbox: "Xbox",
	arcade: "Pixel Arcade",
	galaxy: "Galaxy",
	mocha: "Mocha",
	gameboy: "Game Boy",
	vhs: "VHS Tape",
	vapor: "Vaporwave",
};

export const BG_LABEL: Record<BgMode, string> = {
	off: "Transparent",
	panel: "Panel",
	bubble: "Bubbles",
};
