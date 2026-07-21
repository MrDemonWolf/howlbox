import { cn } from "@howlbox/ui/lib/utils";

import type { BgMode, Theme } from "@/lib/overlay/params";
import type { ChatMessageView } from "@/lib/twitch/types";

import { ChatMessageRow } from "./chat-message";

// themes with light surfaces need pale user colors darkened; every
// other combination (incl. bg=off over gameplay) lightens dark ones
export const LIGHT_SURFACE_THEMES = new Set<Theme>([
	"light",
	"cozy",
	"retro95",
	"xp",
	"mocha",
]);

export type SurfaceTone = "dark" | "light";

// A light surface only shows behind a panel/bubble; bg=off draws over
// arbitrary gameplay, so it always takes the dark-tone treatment.
export function surfaceToneFor(theme: Theme, bg: BgMode): SurfaceTone {
	return bg !== "off" && LIGHT_SURFACE_THEMES.has(theme) ? "light" : "dark";
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
}: MessageListProps) {
	const surfaceTone = surfaceToneFor(theme, bg);
	// An empty panel is a themed rectangle sitting on the stream with
	// nothing in it. Drop the panel chrome until there is chat to hold,
	// so a quiet channel reads as no overlay rather than a dead box.
	// (bubble draws per message and off draws nothing, so both are
	// already self-hiding.)
	const showPanel = bg === "panel" && messages.length > 0;

	return (
		<div
			className={cn(
				"hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 [mask-image:var(--hb-mask)]",
				bg === "bubble" ? "gap-1.5" : "gap-1",
				showPanel && PANEL_CLASSES,
			)}
		>
			{messages.map((message) => (
				<ChatMessageRow
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					key={message.id}
					message={message}
					showAvatars={showAvatars}
					showBadges={showBadges}
					showPronouns={showPronouns}
					showTimestamps={showTimestamps}
					surfaceTone={surfaceTone}
				/>
			))}
		</div>
	);
}
