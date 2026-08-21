import { useCallback, useRef } from "react";

import type {
	Align,
	BgMode,
	THEME_VARIANTS,
	Theme,
} from "@/lib/overlay/params";
import { planTickerRun, tickerPxPerSec } from "@/lib/overlay/ticker";
import type { ChatMessageView } from "@/lib/twitch/types";

import { ChatMessageRow } from "./chat-message";

// Conservative solid reference for each theme. For gradients this is the
// endpoint with the least contrast in the direction the theme uses, so the
// dynamic Twitch name color reaches AA across the whole declared fallback.
const THEME_SURFACE_REFERENCE: Record<Theme, string> = {
	wolf: "#102147",
	glass: "#2c2e38",
	terminal: "#06130a",
	neon: "#280e46",
	dark: "#1c1c20",
	light: "#f2f5fa",
	contrast: "#000000",
	cozy: "#e4dcff",
	nobox: "#101318",
	retro95: "#c0c0c0",
	xp: "#e5e2ce",
	xbox: "#1b201b",
	arcade: "#140e2e",
	galaxy: "#2b1a52",
	mocha: "#e2d0bd",
	gameboy: "#9bbc0f",
	vhs: "#101012",
	vapor: "#7c2c56",
	cyber: "#0c1014",
	hud: "#061420",
	ember: "#241611",
	aurora: "#0e2030",
	sakura: "#ffe0ec",
	forest: "#1b3120",
	ocean: "#083245",
	frost: "#d6e8f8",
	paper: "#f9e88f",
	comic: "#f7f7f2",
	luxe: "#0d0b09",
	brutal: "#ffffff",
	holo: "#e2e6f2",
};

// Typed off THEME_VARIANTS, so declaring a variant without a surface
// reference is a compile error: a hue-flipped variant (amber terminal)
// silently breaks dynamic name contrast otherwise.
const VARIANT_SURFACE_REFERENCE: {
	[T in Theme]: Record<(typeof THEME_VARIANTS)[T][number], string>;
} = {
	wolf: {},
	glass: {},
	terminal: { amber: "#140c04", ice: "#06131a" },
	neon: { cyan: "#0a1a3c", lime: "#182e10" },
	dark: {},
	light: {},
	contrast: {},
	cozy: { mint: "#d6f0ff", peach: "#ffe8d6" },
	nobox: {},
	retro95: {},
	xp: {},
	xbox: {},
	arcade: {},
	galaxy: { nebula: "#123c4c" },
	mocha: {},
	gameboy: { pocket: "#b8b8a8", virtual: "#0a0000" },
	vhs: {},
	vapor: {},
	cyber: { gold: "#14110a" },
	hud: {},
	ember: { coal: "#1c1c20" },
	aurora: {},
	sakura: {},
	forest: {},
	ocean: { tropic: "#083a34" },
	frost: {},
	paper: {},
	comic: {},
	// luxe variants only reskin the metal ring, so they keep the base
	// near-black surface reference
	luxe: { silver: "#0d0b09", rose: "#0d0b09" },
	brutal: {},
	holo: {},
};

function surfaceColorFor(
	theme: Theme,
	variant: string,
	bg: BgMode,
): string | undefined {
	if (bg === "off") {
		return undefined;
	}
	const variantReference = (
		VARIANT_SURFACE_REFERENCE[theme] as Record<string, string>
	)[variant];
	return variantReference ?? THEME_SURFACE_REFERENCE[theme];
}

const PANEL_CLASSES =
	"m-2 rounded-(--hb-radius) border border-(--hb-border) p-3 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

interface MessageListProps {
	messages: ChatMessageView[];
	bg: BgMode;
	theme: Theme;
	variant?: string;
	// ?group: consecutive rows from one chatter share one header
	group?: boolean;
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	showAvatars?: boolean;
	animate: boolean;
	fadeSeconds: number;
	// ?scroll=ticker: one horizontal lane instead of the vertical stack
	ticker?: boolean;
	// ?scrollspeed multiplier, 1x to 5x
	scrollSpeed?: number;
	// ?align picks the lane's direction: right sends messages right to
	// left, left sends them the way you read
	align?: Align;
	onMessageExpired?: (id: string) => void;
}

// The hb-messages column shared by the live overlay and the landing
// previews. Presentational only: each caller owns its own positioning
// (the overlay is fixed full-screen, the previews are absolute cards),
// so this renders just the message stack, never the hb-root wrapper.
export function MessageList({
	messages,
	bg,
	theme,
	variant = "",
	group = false,
	showBadges,
	showPronouns,
	showTimestamps,
	showAvatars = false,
	animate,
	fadeSeconds,
	ticker = false,
	scrollSpeed = 1,
	align = "left",
	onMessageExpired,
}: MessageListProps) {
	const surfaceColor = surfaceColorFor(theme, variant, bg);
	const laneRef = useRef<HTMLDivElement>(null);
	// where the lane is clear again. Lives in this closure rather than in
	// a prop, so the only thing crossing into the memoized row is the
	// stable callback below.
	const freeAtRef = useRef(0);
	// read inside the callback instead of closed over, so changing the
	// speed never changes the callback identity
	const speedRef = useRef(scrollSpeed);
	speedRef.current = scrollSpeed;
	const expireRef = useRef(onMessageExpired);
	expireRef.current = onMessageExpired;
	// left to right is the same run played backwards, so the direction
	// costs one keyword rather than a second keyframe
	const reverseRef = useRef(align === "left");
	reverseRef.current = align === "left";

	// Measure and schedule one run, once, when the row mounts. This is
	// the only place in the overlay that writes to a DOM node React owns:
	// the row never puts `animation` in its style prop in ticker mode, so
	// React has nothing to clear on a re-render.
	const handleTickerMount = useCallback((node: HTMLDivElement, id: string) => {
		const lane = laneRef.current;
		if (!lane || node.dataset.hbTicker !== undefined) {
			return;
		}
		node.dataset.hbTicker = "";
		// re-read every time: the bg=panel chrome appears with the first
		// message and changes the lane width by 24px
		const containerWidth = lane.clientWidth;
		// The clock animation-delay is measured against. It must be this
		// one and not performance.now(): a hidden document freezes the
		// document timeline, so the cursor freezes with the animations
		// instead of racing ahead of them and dumping a whole backlog on
		// screen the moment OBS shows the source again. Note the reading
		// is legitimately 0 while hidden, so this cannot be a truthiness
		// check.
		const timeline = document.timeline.currentTime;
		const run = planTickerRun({
			now: typeof timeline === "number" ? timeline : performance.now(),
			freeAt: freeAtRef.current,
			ownWidth: node.offsetWidth,
			containerWidth,
			pxPerSec: tickerPxPerSec(speedRef.current),
		});
		// null is the backlog case. Drop the message now rather than
		// parking it: a run takes 10-20s while a busy channel refills
		// ?max in about three, so a queue of never-scheduled rows would
		// push the ones actually in flight out of the list and leave the
		// lane empty. Only messages that are flying hold a slot.
		if (!run) {
			expireRef.current?.(id);
			return;
		}
		freeAtRef.current = run.nextFreeAt;
		// The travel distance belongs to the row, not the lane: a later
		// row re-measures after the panel chrome appears or the source is
		// resized, and a shared variable would hand that new distance to
		// every row already in flight while their durations stayed, which
		// reads as a speed jump mid-run.
		node.style.setProperty("--hb-ticker-w", `${containerWidth}px`);
		const direction = reverseRef.current ? "reverse" : "normal";
		node.style.animation = `hb-ticker ${run.durationMs}ms linear ${run.delayMs}ms 1 ${direction} forwards`;
	}, []);
	// An empty panel is a themed rectangle sitting on the stream with
	// nothing in it. Drop the panel chrome until there is chat to hold,
	// so a quiet channel reads as no overlay rather than a dead box.
	// (bubble draws per message and off draws nothing, so both are
	// already self-hiding.)
	const showPanel = bg === "panel" && messages.length > 0;
	const className = [
		"hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 [mask-image:var(--hb-mask)]",
		bg === "bubble" ? "gap-1.5" : "gap-1",
		showPanel ? PANEL_CLASSES : undefined,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={className} ref={laneRef}>
			{messages.map((message, index) => {
				// Adjacency is recomputed every render, so a continuation row
				// whose predecessor gets evicted (delay buffer, fade, max)
				// regrows its header on its own. Event rows never group and
				// always break a chain: their text names people itself.
				const previous = index > 0 ? messages[index - 1] : undefined;
				const grouped =
					group &&
					previous !== undefined &&
					!message.event &&
					!previous.event &&
					previous.login === message.login;
				return (
					<ChatMessageRow
						animate={animate}
						bg={bg}
						fadeSeconds={fadeSeconds}
						grouped={grouped}
						key={message.id}
						message={message}
						onExpire={onMessageExpired}
						showAvatars={showAvatars}
						showBadges={showBadges}
						showPronouns={showPronouns}
						showTimestamps={showTimestamps}
						surfaceColor={surfaceColor}
						onTickerMount={ticker ? handleTickerMount : undefined}
						ticker={ticker}
					/>
				);
			})}
		</div>
	);
}
