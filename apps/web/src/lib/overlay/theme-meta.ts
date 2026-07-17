import type { BgMode, Theme } from "@/lib/overlay/params";

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
	arcade: "linear-gradient(135deg,#140e2e,#ffd23f)",
	galaxy: "linear-gradient(135deg,#582c8a,#0a0a24)",
	mocha: "linear-gradient(135deg,#f3e8da,#8a5a3b)",
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
	arcade: "Pixel Arcade",
	galaxy: "Galaxy",
	mocha: "Mocha",
};

export const BG_LABEL: Record<BgMode, string> = {
	off: "Transparent",
	panel: "Panel",
	bubble: "Bubbles",
};
