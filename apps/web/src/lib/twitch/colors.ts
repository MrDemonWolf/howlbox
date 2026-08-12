// Twitch's own default palette. Users who never picked a chat color get
// one assigned from this list; we approximate that with a first + last
// char code hash of the login, so an uncolored viewer still gets a
// stable, on-brand color close to (not always identical to) twitch.tv.
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

function contrastRatio(
	foreground: [number, number, number],
	background: [number, number, number],
): number {
	const foregroundLuminance = relativeLuminance(foreground);
	const backgroundLuminance = relativeLuminance(background);
	return (
		(Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
		(Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
	);
}

function mixToward(
	[r, g, b]: [number, number, number],
	target: number,
	amount: number,
): [number, number, number] {
	const channel = (v: number) => Math.round(v + (target - v) * amount);
	return [channel(r), channel(g), channel(b)];
}

function toHex([r, g, b]: [number, number, number]): string {
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const MIN_TEXT_CONTRAST = 4.5;

// Twitch lets users pick any color, including navy on a dark overlay or
// pale yellow on a light one. Move only as far toward black or white as the
// actual theme surface requires, rather than using broad light/dark
// thresholds that still leave many ordinary Twitch colors below 4.5:1.
export function readableUserColor(
	color: string,
	backgroundColor?: string,
): string {
	const rgb = parseHex(color);
	const background = backgroundColor ? parseHex(backgroundColor) : null;
	if (!rgb || !background) {
		return color;
	}

	if (contrastRatio(rgb, background) >= MIN_TEXT_CONTRAST) {
		return color;
	}

	// Use whichever endpoint has more contrast with this particular surface.
	const black: [number, number, number] = [0, 0, 0];
	const white: [number, number, number] = [255, 255, 255];
	const target =
		contrastRatio(white, background) >= contrastRatio(black, background)
			? 255
			: 0;

	// Binary-search 8-bit mix steps. This is deterministic, takes at most
	// eight iterations per new row, and preserves as much hue as AA allows.
	let low = 0;
	let high = 255;
	while (low < high) {
		const middle = Math.floor((low + high) / 2);
		const candidate = mixToward(rgb, target, middle / 255);
		if (contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST) {
			high = middle;
		} else {
			low = middle + 1;
		}
	}
	return toHex(mixToward(rgb, target, low / 255));
}

const DARK_TEXT_OUTLINE =
	"-1px -1px 0 rgb(255 255 255 / 0.95), 1px -1px 0 rgb(255 255 255 / 0.95), -1px 1px 0 rgb(255 255 255 / 0.95), 1px 1px 0 rgb(255 255 255 / 0.95), 0 1px 3px rgb(0 0 0 / 0.5)";
const LIGHT_TEXT_OUTLINE =
	"-1px -1px 0 rgb(0 0 0 / 0.95), 1px -1px 0 rgb(0 0 0 / 0.95), -1px 1px 0 rgb(0 0 0 / 0.95), 1px 1px 0 rgb(0 0 0 / 0.95), 0 1px 3px rgb(0 0 0 / 0.7)";

// A transparent page cannot know the gameplay color OBS will composite
// behind it. Give each dynamic name the opposite-luminance outline.
export function userColorOutline(color: string): string {
	const rgb = parseHex(color);
	if (!rgb) {
		return LIGHT_TEXT_OUTLINE;
	}
	return relativeLuminance(rgb) < 0.35 ? DARK_TEXT_OUTLINE : LIGHT_TEXT_OUTLINE;
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
