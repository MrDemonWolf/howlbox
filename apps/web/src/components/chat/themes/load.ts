import type { Theme } from "@/lib/overlay/config";

// Wolf is the .hb-root base in overlay.css itself, so it costs no extra
// fetch. Keyed as a Record so a new THEMES entry fails to compile until
// it has a loader entry, same as the label and swatch maps.
const THEME_CSS: Record<Theme, (() => Promise<unknown>) | null> = {
	wolf: null,
	glass: () => import("./glass.css"),
	terminal: () => import("./terminal.css"),
	neon: () => import("./neon.css"),
	dark: () => import("./dark.css"),
	light: () => import("./light.css"),
	contrast: () => import("./contrast.css"),
	cozy: () => import("./cozy.css"),
	nobox: () => import("./nobox.css"),
	retro95: () => import("./retro95.css"),
	xp: () => import("./xp.css"),
	xbox: () => import("./xbox.css"),
	arcade: () => import("./arcade.css"),
	galaxy: () => import("./galaxy.css"),
	mocha: () => import("./mocha.css"),
	gameboy: () => import("./gameboy.css"),
	vhs: () => import("./vhs.css"),
	vapor: () => import("./vapor.css"),
	cyber: () => import("./cyber.css"),
	hud: () => import("./hud.css"),
	ember: () => import("./ember.css"),
	aurora: () => import("./aurora.css"),
	sakura: () => import("./sakura.css"),
	forest: () => import("./forest.css"),
	ocean: () => import("./ocean.css"),
	frost: () => import("./frost.css"),
	paper: () => import("./paper.css"),
	comic: () => import("./comic.css"),
	luxe: () => import("./luxe.css"),
	brutal: () => import("./brutal.css"),
	holo: () => import("./holo.css"),
};

// Resolves when the theme sheet has applied, the import failed, or the
// timeout fired, and never rejects: a missing or hung chunk must never
// blank the overlay, it just renders on the wolf base variables. The
// import is not cancelled on timeout, so a chunk that arrives late still
// applies (brief wolf, then the chosen theme). No retry loop on purpose:
// hidden OBS sources throttle timers, and the reconnect rules in
// CLAUDE.md apply to stylesheets too.
export function loadThemeCss(theme: Theme, timeoutMs = 2000): Promise<void> {
	const importer = THEME_CSS[theme];
	if (!importer) {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, timeoutMs);
		importer()
			.then(
				() => undefined,
				() => {
					// OBS often autostarts at boot before the network is up, and
					// a chunk that failed once would otherwise leave the whole
					// session on wolf. One event-driven re-attempt when the
					// network returns, mirroring the chat.ts nudge pattern; no
					// timer loops, hidden sources throttle timers.
					window.addEventListener(
						"online",
						() => void importer().catch(() => undefined),
						{ once: true },
					);
				},
			)
			.then(() => {
				clearTimeout(timer);
				resolve();
			});
	});
}
