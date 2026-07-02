// Twitch's own default palette, assigned the same way Twitch does for
// users who never picked a chat color (first + last char code hash),
// so fallback colors match what viewers see on twitch.tv.
const TWITCH_DEFAULT_COLORS = [
	"#FF0000",
	"#0000FF",
	"#008000",
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
	"#8A2BE2",
	"#00FF7F",
] as const;

function channelToLinear(value: number): number {
	const s = value / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function parseHex(color: string): [number, number, number] | null {
	const match = /^#([0-9a-f]{6})$/i.exec(color);
	if (!match?.[1]) {
		return null;
	}
	const n = Number.parseInt(match[1], 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
	return (
		0.2126 * channelToLinear(r) +
		0.7152 * channelToLinear(g) +
		0.0722 * channelToLinear(b)
	);
}

function mixToward(
	[r, g, b]: [number, number, number],
	target: number,
	amount: number,
): string {
	const channel = (v: number) => Math.round(v + (target - v) * amount);
	return `#${[channel(r), channel(g), channel(b)]
		.map((v) => v.toString(16).padStart(2, "0"))
		.join("")}`;
}

// Twitch lets users pick any color, including navy on a dark overlay
// or pale yellow on a light one. Same fix the popular S0N0S KapChat
// themes use: pull extremes toward readable without erasing identity.
export function readableUserColor(
	color: string,
	surface: "dark" | "light",
): string {
	const rgb = parseHex(color);
	if (!rgb) {
		return color;
	}
	const luminance = relativeLuminance(rgb);
	if (surface === "dark" && luminance < 0.18) {
		return mixToward(rgb, 255, 0.45);
	}
	if (surface === "light" && luminance > 0.6) {
		return mixToward(rgb, 0, 0.45);
	}
	return color;
}

export function fallbackColor(login: string): string {
	if (login.length === 0) {
		return TWITCH_DEFAULT_COLORS[0];
	}
	const index =
		(login.charCodeAt(0) + login.charCodeAt(login.length - 1)) %
		TWITCH_DEFAULT_COLORS.length;
	return TWITCH_DEFAULT_COLORS[index] ?? TWITCH_DEFAULT_COLORS[0];
}
