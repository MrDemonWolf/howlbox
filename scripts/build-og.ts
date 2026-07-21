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
 * Rendering goes through headless Chrome rather than an SVG rasterizer
 * because the layout is text, and every Node-side rasterizer needs the
 * font handed to it as TTF or OTF. Inter ships as woff2 only, so the
 * template embeds the woff2 as a data URI and lets a real browser do
 * the typesetting. Same engine OBS uses, no new dependency, and the
 * output does not depend on which fonts the machine happens to have.
 *
 * Requires Google Chrome installed at the standard macOS path. If you
 * are on another platform, point CHROME at your binary.
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CHROME =
	process.env.CHROME ??
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "apps/web/public");
const FONT = join(
	ROOT,
	"apps/web/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
);

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
const PAW = `<svg viewBox="0 0 64 64" width="52" height="52" fill="${C.brandText}" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 33c-6.6 0-12 4.3-12 9.6 0 3.6 2.8 5.4 6.2 5.4 2.2 0 3.9-1 5.8-1s3.6 1 5.8 1c3.4 0 6.2-1.8 6.2-5.4C44 37.3 38.6 33 32 33Z"/>
  <ellipse cx="20.5" cy="28" rx="4" ry="5.2"/><ellipse cx="43.5" cy="28" rx="4" ry="5.2"/>
  <ellipse cx="27" cy="21.5" rx="3.6" ry="4.8"/><ellipse cx="37" cy="21.5" rx="3.6" ry="4.8"/>
</svg>`;

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
		facts: ["15 themes", "7TV, BTTV, FFZ", "No account", "Self-hosted"],
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

function html(card: Card, fontDataUri: string) {
	return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: "Inter";
    src: url("${fontDataUri}") format("woff2-variations");
    font-weight: 100 900;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: ${C.base};
    font-family: "Inter", system-ui, sans-serif;
    color: ${C.text};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 64px 72px;
    position: relative;
  }
  /* one soft brand wash, top right. No aurora, no grain: the site
     dropped those and the card should look like the site. */
  .wash {
    position: absolute; inset: 0;
    background: radial-gradient(46% 58% at 88% 6%, rgba(0,172,237,0.20), transparent 68%);
  }
  header, main, footer { position: relative; }
  header { display: flex; align-items: center; gap: 16px; }
  .wordmark { font-size: 34px; font-weight: 700; letter-spacing: -0.02em; }
  h1 {
    font-size: 82px; font-weight: 700; line-height: 1.03;
    letter-spacing: -0.035em; max-width: 20ch;
  }
  h1 .accent { color: ${C.brandText}; }
  .chip {
    display: inline-flex; align-items: center; gap: 12px;
    margin-top: 30px; padding: 14px 20px;
    background: ${C.elev}; border: 1px solid ${C.line}; border-radius: 12px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 22px; color: ${C.muted};
  }
  .dot { width: 10px; height: 10px; border-radius: 999px; background: ${C.brand}; }
  footer { display: flex; gap: 14px; flex-wrap: wrap; }
  .fact {
    padding: 10px 18px; border: 1px solid ${C.line}; border-radius: 999px;
    background: ${C.elev}; color: ${C.muted}; font-size: 21px; font-weight: 500;
  }
</style></head>
<body>
  <div class="wash"></div>
  <header>${PAW}<span class="wordmark">HowlBox</span></header>
  <main>
    <h1>${card.headline}<br><span class="accent">${card.accent}</span></h1>
    <div class="chip"><span class="dot"></span>${card.chip}</div>
  </main>
  <footer>${card.facts.map((f) => `<span class="fact">${f}</span>`).join("")}</footer>
</body></html>`;
}

const font = await readFile(FONT);
const fontDataUri = `data:font/woff2;base64,${font.toString("base64")}`;
const work = await mkdtemp(join(tmpdir(), "howlbox-og-"));

try {
	for (const card of CARDS) {
		const page = join(work, `${card.file}.html`);
		await writeFile(page, html(card, fontDataUri));

		const proc = Bun.spawn(
			[
				CHROME,
				"--headless",
				"--disable-gpu",
				"--hide-scrollbars",
				"--force-device-scale-factor=1",
				"--window-size=1200,630",
				`--screenshot=${join(PUBLIC, card.file)}`,
				pathToFileURL(page).href,
			],
			{ stdout: "pipe", stderr: "pipe" },
		);
		const code = await proc.exited;
		if (code !== 0) {
			throw new Error(
				`chrome exited ${code} for ${card.file}: ${await new Response(proc.stderr).text()}`,
			);
		}
		console.log(`wrote public/${card.file}`);
	}
} finally {
	await rm(work, { recursive: true, force: true });
}
