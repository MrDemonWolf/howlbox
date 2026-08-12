import type { BgMode, Theme } from "@/lib/overlay/params";
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
};

function surfaceColorFor(theme: Theme, bg: BgMode): string | undefined {
	return bg === "off" ? undefined : THEME_SURFACE_REFERENCE[theme];
}

const PANEL_CLASSES =
	"m-2 rounded-(--hb-radius) border border-(--hb-border) p-3 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

interface MessageListProps {
	messages: ChatMessageView[];
	bg: BgMode;
	theme: Theme;
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
	showBadges,
	showPronouns,
	showTimestamps,
	showAvatars = false,
	animate,
	fadeSeconds,
	onMessageExpired,
}: MessageListProps) {
	const surfaceColor = surfaceColorFor(theme, bg);
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
			{messages.map((message) => (
				<ChatMessageRow
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					key={message.id}
					message={message}
					onExpire={onMessageExpired}
					showAvatars={showAvatars}
					showBadges={showBadges}
					showPronouns={showPronouns}
					showTimestamps={showTimestamps}
					surfaceColor={surfaceColor}
				/>
			))}
		</div>
	);
}
