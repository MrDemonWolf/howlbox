import type { BgMode, THEME_VARIANTS, Theme } from "@/lib/overlay/params";
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
	gameboy: { pocket: "#b8b8a8", virtual: "#0a0000" },
	vhs: {},
	vapor: {},
	cyber: { gold: "#14110a" },
	hud: {},
	ember: { coal: "#1c1c20" },
	aurora: {},
	sakura: {},
	forest: {},
	ocean: { tropic: "#0a4a42" },
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
	onMessageExpired,
}: MessageListProps) {
	const surfaceColor = surfaceColorFor(theme, variant, bg);
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
		<div className={className}>
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
					/>
				);
			})}
		</div>
	);
}
