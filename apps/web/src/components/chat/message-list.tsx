import { cn } from "@howlbox/ui/lib/utils";

import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView } from "@/lib/twitch/types";

import { ChatMessageRow } from "./chat-message";

// themes with light surfaces need pale user colors darkened; every
// other combination (incl. bg=off over gameplay) lightens dark ones
export const LIGHT_SURFACE_THEMES = new Set([
	"light",
	"cozy",
	"retro95",
	"mocha",
]);

const PANEL_CLASSES =
	"m-2 rounded-(--hb-radius) border border-(--hb-border) p-3 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

interface MessageListProps {
	messages: ChatMessageView[];
	bg: OverlayParams["bg"];
	theme: OverlayParams["theme"];
	showBadges: boolean;
	showTimestamps: boolean;
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
	showTimestamps,
	animate,
	fadeSeconds,
}: MessageListProps) {
	const surfaceTone =
		bg !== "off" && LIGHT_SURFACE_THEMES.has(theme) ? "light" : "dark";

	return (
		<div
			className={cn(
				"hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 [mask-image:var(--hb-mask)]",
				bg === "bubble" ? "gap-1.5" : "gap-1",
				bg === "panel" && PANEL_CLASSES,
			)}
		>
			{messages.map((message) => (
				<ChatMessageRow
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					key={message.id}
					message={message}
					showBadges={showBadges}
					showTimestamps={showTimestamps}
					surfaceTone={surfaceTone}
				/>
			))}
		</div>
	);
}
