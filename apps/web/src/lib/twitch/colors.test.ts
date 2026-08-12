import { describe, expect, test } from "bun:test";

import { readableUserColor, userColorOutline } from "./colors";

function rgb(hex: string): [number, number, number] {
	const value = hex.replace("#", "");
	return [
		Number.parseInt(value.slice(0, 2), 16),
		Number.parseInt(value.slice(2, 4), 16),
		Number.parseInt(value.slice(4, 6), 16),
	];
}

function luminance(color: string): number {
	const channels = rgb(color).map((value) => {
		const normalized = value / 255;
		return normalized <= 0.04045
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});
	return (
		(channels[0] ?? 0) * 0.2126 +
		(channels[1] ?? 0) * 0.7152 +
		(channels[2] ?? 0) * 0.0722
	);
}

function contrast(foreground: string, background: string): number {
	const first = luminance(foreground);
	const second = luminance(background);
	return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const SURFACES = [
	"#102147",
	"#2c2e38",
	"#06130a",
	"#280e46",
	"#1c1c20",
	"#f2f5fa",
	"#000000",
	"#e4dcff",
	"#101318",
	"#c0c0c0",
	"#e5e2ce",
	"#1b201b",
	"#140e2e",
	"#2b1a52",
	"#e2d0bd",
] as const;

const TWITCH_COLORS = [
	"#0000FF",
	"#FF0000",
	"#8A2BE2",
	"#00FF7F",
	"#B22222",
	"#FF7F50",
	"#9ACD32",
	"#FF4500",
	"#2E8B57",
	"#DAA520",
	"#D2691E",
	"#5F9EA0",
	"#1E90FF",
	"#FF69B4",
	"#00ACED",
] as const;

describe("readableUserColor", () => {
	test("meets AA against every theme surface reference", () => {
		for (const surface of SURFACES) {
			for (const color of TWITCH_COLORS) {
				const readable = readableUserColor(color, surface);
				expect(contrast(readable, surface)).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	test("preserves a color that already clears AA", () => {
		expect(readableUserColor("#FFFFFF", "#000000")).toBe("#FFFFFF");
		expect(readableUserColor("#000000", "#FFFFFF")).toBe("#000000");
	});

	test("leaves invalid or surface-free colors unchanged", () => {
		expect(readableUserColor("currentColor", "#000000")).toBe("currentColor");
		expect(readableUserColor("#2E8B57")).toBe("#2E8B57");
	});
});

describe("userColorOutline", () => {
	test("puts a light edge around dark names", () => {
		expect(userColorOutline("#000080")).toContain("255 255 255");
	});

	test("puts a dark edge around light names and invalid values", () => {
		expect(userColorOutline("#FFD700")).toContain("0 0 0");
		expect(userColorOutline("not-a-color")).toContain("0 0 0");
	});
});
