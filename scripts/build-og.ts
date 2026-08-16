/**
 * Renders the Open Graph images.
 *
 * Run by hand when the art or the copy on it changes, then commit the
 * PNGs. It is deliberately NOT part of the build or of CI: the images
 * change maybe twice a year, and a hermetic deploy is worth more than
 * automating a job that rarely runs.
 *
 *   bun run og
 *
 * Rendering goes through Satori (JSX -> SVG) and resvg (SVG -> PNG),
 * no headless browser and no system binary to install. Satori's font
 * parser trips on the variable font's fvar axis table (an opentype.js
 * fork issue, not a woff2 issue: it reads WOFF fine), so this pulls a
 * static weight from @fontsource/inter instead of the variable family
 * the site itself uses. Same typeface, one weight, dev-only dependency.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "apps/web/public");
const FONT_DIR = join(ROOT, "node_modules/@fontsource/inter/files");

// Dark tokens, matching html:not(.hb-overlay).dark in apps/web/src/index.css.
// Dark reads well in both light and dark clients; a white card on a white
// Discord background disappears into it.
const C = {
	base: "#050912",
	elev: "#0e1526",
	line: "#1e2637",
	brand: "#00aced",
	brandText: "#7fd7ff",
	text: "#f2f7ff",
	muted: "#a3adbd",
};

// The paw from apps/web/public/favicon.svg, same geometry as the header
// mark in components/landing/paw-mark.tsx.
const PAW_PATH =
	"M32 33c-6.6 0-12 4.3-12 9.6 0 3.6 2.8 5.4 6.2 5.4 2.2 0 3.9-1 5.8-1s3.6 1 5.8 1c3.4 0 6.2-1.8 6.2-5.4C44 37.3 38.6 33 32 33Z";
const PAW_PADS: [number, number, number, number][] = [
	[20.5, 28, 4, 5.2],
	[43.5, 28, 4, 5.2],
	[27, 21.5, 3.6, 4.8],
	[37, 21.5, 3.6, 4.8],
];

interface Card {
	file: string;
	headline: string;
	/** the brand-colored tail of the headline */
	accent: string;
	chip: string;
	facts: string[];
}

const CARDS: Card[] = [
	{
		file: "og.png",
		headline: "The whole overlay is",
		accent: "one URL",
		chip: "/overlay?channel=you&theme=wolf&bg=bubble",
		facts: ["31 themes", "7TV, BTTV, FFZ", "No account", "Self-hosted"],
	},
	{
		file: "og-docs.png",
		headline: "Every parameter,",
		accent: "every hook",
		chip: "/docs#param-badgeart",
		facts: [
			"18 parameters",
			"hb-* CSS contract",
			"Badge art",
			"Troubleshooting",
		],
	},
	{
		file: "og-config.png",
		headline: "Build your",
		accent: "overlay URL",
		chip: "/config",
		facts: ["Live preview", "Paste to load", "Copy, then paste into OBS"],
	},
];

// Satori takes a JSX-shaped element tree, not markup, and every flex
// container needs an explicit display: "flex" (it has no default block
// layout to fall back on).
function paw() {
	return {
		type: "svg",
		props: {
			viewBox: "0 0 64 64",
			width: 52,
			height: 52,
			fill: C.brandText,
			style: { display: "flex" },
			children: [
				{ type: "path", props: { d: PAW_PATH } },
				...PAW_PADS.map(([cx, cy, rx, ry]) => ({
					type: "ellipse",
					props: { cx, cy, rx, ry },
				})),
			],
		},
	};
}

function card(c: Card) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				width: 1200,
				height: 630,
				padding: "64px 72px",
				background: C.base,
				backgroundImage:
					"radial-gradient(circle at 88% 6%, rgba(0,172,237,0.20), transparent 68%)",
				fontFamily: "Inter",
				color: C.text,
			},
			children: [
				{
					type: "div",
					props: {
						style: { display: "flex", alignItems: "center", gap: 16 },
						children: [
							paw(),
							{
								type: "span",
								props: {
									style: {
										fontSize: 34,
										fontWeight: 700,
										letterSpacing: "-0.02em",
									},
									children: "HowlBox",
								},
							},
						],
					},
				},
				{
					type: "div",
					props: {
						style: { display: "flex", flexDirection: "column" },
						children: [
							{
								type: "div",
								props: {
									style: {
										display: "flex",
										flexDirection: "column",
										fontSize: 82,
										fontWeight: 700,
										lineHeight: 1.03,
										letterSpacing: "-0.035em",
										// px, not ch: satori's ch unit resolves far narrower than
										// the browser did, which wrapped one word per line
										maxWidth: 760,
									},
									children: [
										c.headline,
										{
											type: "span",
											props: {
												style: { color: C.brandText },
												children: c.accent,
											},
										},
									],
								},
							},
							{
								type: "div",
								props: {
									style: {
										display: "flex",
										alignItems: "center",
										gap: 12,
										marginTop: 30,
										padding: "14px 20px",
										background: C.elev,
										border: `1px solid ${C.line}`,
										borderRadius: 12,
										fontFamily: "monospace",
										fontSize: 22,
										color: C.muted,
										// the parent column stretches children by default;
										// flex-start shrinks this one to its content instead
										// (satori's layout subset has no fit-content keyword)
										alignSelf: "flex-start",
									},
									children: [
										{
											type: "span",
											props: {
												style: {
													width: 10,
													height: 10,
													borderRadius: 999,
													background: C.brand,
													display: "flex",
												},
											},
										},
										c.chip,
									],
								},
							},
						],
					},
				},
				{
					type: "div",
					props: {
						style: { display: "flex", gap: 14, flexWrap: "wrap" },
						children: c.facts.map((f) => ({
							type: "span",
							props: {
								style: {
									padding: "10px 18px",
									border: `1px solid ${C.line}`,
									borderRadius: 999,
									background: C.elev,
									color: C.muted,
									fontSize: 21,
									fontWeight: 500,
								},
								children: f,
							},
						})),
					},
				},
			],
		},
	};
}

async function weight(w: 500 | 700) {
	const buf = await readFile(join(FONT_DIR, `inter-latin-${w}-normal.woff`));
	return buf.buffer.slice(
		buf.byteOffset,
		buf.byteOffset + buf.byteLength,
	) as ArrayBuffer;
}

// only the two weights the cards actually set (headline/wordmark at 700,
// facts at 500); satori has no fallback weight synthesis, so both must
// be registered or the unlisted one silently renders as the nearest one
const fonts = [
	{
		name: "Inter",
		data: await weight(500),
		weight: 500 as const,
		style: "normal" as const,
	},
	{
		name: "Inter",
		data: await weight(700),
		weight: 700 as const,
		style: "normal" as const,
	},
];

for (const c of CARDS) {
	const svg = await satori(card(c), { width: 1200, height: 630, fonts });
	const png = new Resvg(svg, {
		fitTo: { mode: "width", value: 1200 },
	}).render();
	await writeFile(join(PUBLIC, c.file), png.asPng());
	console.log(`wrote public/${c.file}`);
}
