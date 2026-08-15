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
	cyber: "gamer",
	hud: "gamer",
	ember: "gamer",
	aurora: "gamer",
	sakura: "cozy",
	forest: "cozy",
	ocean: "cozy",
	frost: "cozy",
	paper: "cozy",
	comic: "cozy",
	luxe: "clean",
	brutal: "clean",
	holo: "clean",
};

// Per-variant picker metadata, typed off THEME_VARIANTS so a declared
// variant cannot ship without a label and swatch.
type VariantMeta = {
	[T in Theme]: Record<(typeof THEME_VARIANTS)[T][number], string>;
};

export const VARIANT_LABEL: VariantMeta = {
	wolf: {},
	glass: {},
	terminal: { amber: "Amber", ice: "Ice" },
	neon: { cyan: "Cyan", lime: "Lime" },
	dark: {},
	light: {},
	contrast: {},
	cozy: { mint: "Mint", peach: "Peach" },
	nobox: {},
	retro95: {},
	xp: {},
	xbox: {},
	arcade: {},
	galaxy: { nebula: "Nebula" },
	mocha: {},
	gameboy: { pocket: "Pocket", virtual: "Virtual Boy" },
	vhs: {},
	vapor: {},
	cyber: { gold: "Gold" },
	hud: {},
	ember: { coal: "Coal" },
	aurora: {},
	sakura: {},
	forest: {},
	ocean: { tropic: "Tropic" },
	frost: {},
	paper: {},
	comic: {},
	luxe: { silver: "Silver", rose: "Rose Gold" },
	brutal: {},
	holo: {},
};

export const VARIANT_SWATCH: VariantMeta = {
	wolf: {},
	glass: {},
	terminal: {
		amber: "linear-gradient(135deg,#140c04,#ffb052)",
		ice: "linear-gradient(135deg,#06131a,#7adcf5)",
	},
	neon: {
		cyan: "linear-gradient(135deg,#0a1a3c,#40e8ff)",
		lime: "linear-gradient(135deg,#182e10,#b4ff39)",
	},
	dark: {},
	light: {},
	contrast: {},
	cozy: {
		mint: "linear-gradient(135deg,#e0fff0,#1d7a5f)",
		peach: "linear-gradient(135deg,#ffe8d6,#a8461f)",
	},
	nobox: {},
	retro95: {},
	xp: {},
	xbox: {},
	arcade: {},
	galaxy: { nebula: "linear-gradient(135deg,#123c4c,#7ce8f0)" },
	mocha: {},
	gameboy: {
		pocket: "linear-gradient(135deg,#b8b8a8 60%,#20201a)",
		virtual: "linear-gradient(135deg,#0a0000 55%,#ff2a2a)",
	},
	vhs: {},
	vapor: {},
	cyber: { gold: "linear-gradient(135deg,#14110a 55%,#fce303)" },
	hud: {},
	ember: { coal: "linear-gradient(135deg,#0e0e10,#c9ccd4)" },
	aurora: {},
	sakura: {},
	forest: {},
	ocean: { tropic: "linear-gradient(135deg,#0a4a42,#52f0c8)" },
	frost: {},
	paper: {},
	comic: {},
	luxe: {
		silver: "linear-gradient(135deg,#0d0b09 55%,#c8ccd4)",
		rose: "linear-gradient(135deg,#0d0b09 55%,#e0a48c)",
	},
	brutal: {},
	holo: {},
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
	cyber: "linear-gradient(135deg,#0c1014 55%,#03dffc)",
	hud: "linear-gradient(135deg,#061420 60%,#7df9ff)",
	ember: "linear-gradient(135deg,#120c08,#ff6018)",
	aurora: "linear-gradient(135deg,#050a14,#40e8b4 70%,#7864ff)",
	sakura: "linear-gradient(135deg,#fff5f9,#ffb7d0 70%,#b8305f)",
	forest: "linear-gradient(135deg,#1b3120,#8fd07a)",
	ocean: "linear-gradient(135deg,#083245,#46d4e8)",
	frost: "linear-gradient(135deg,#f0f8ff,#7ab4e6)",
	paper: "linear-gradient(135deg,#fdf1a7,#b4963c)",
	comic: "linear-gradient(135deg,#ffffff 55%,#c21e2a)",
	luxe: "linear-gradient(135deg,#0d0b09 55%,#d4af37)",
	brutal: "linear-gradient(135deg,#ffffff 60%,#0a0a0a)",
	holo: "linear-gradient(135deg,#ff78c8,#78c8ff 45%,#a0ffc8)",
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
	cyber: "Cyberpunk",
	hud: "Sci-fi HUD",
	ember: "Ember",
	aurora: "Aurora",
	sakura: "Sakura",
	forest: "Forest",
	ocean: "Deep Sea",
	frost: "Frost",
	paper: "Sticky Note",
	comic: "Comic",
	luxe: "Gold Luxe",
	brutal: "Brutalist",
	holo: "Holographic",
};

export const BG_LABEL: Record<BgMode, string> = {
	off: "Transparent",
	panel: "Panel",
	bubble: "Bubbles",
};
