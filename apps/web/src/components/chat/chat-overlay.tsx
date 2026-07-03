import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

import { ChatMessageRow } from "./chat-message";

interface ChatOverlayProps {
	messages: ChatMessageView[];
	status: ConnectionStatus;
	bg: OverlayParams["bg"];
	theme: OverlayParams["theme"];
}

const PANEL_CLASSES =
	"m-2 rounded-(--hb-radius) border border-(--hb-border) p-3 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

// themes with light surfaces need pale user colors darkened; every
// other combination (incl. bg=off over gameplay) lightens dark ones
export const LIGHT_SURFACE_THEMES = new Set([
	"light",
	"cozy",
	"retro95",
	"mocha",
]);

const STATUS_LABEL: Record<Exclude<ConnectionStatus, "connected">, string> = {
	connecting: "connecting to chat",
	disconnected: "disconnected, retrying",
	join_failed: "could not join channel",
};

export function ChatOverlay({ messages, status, bg, theme }: ChatOverlayProps) {
	const surfaceTone =
		bg !== "off" && LIGHT_SURFACE_THEMES.has(theme) ? "light" : "dark";

	return (
		<div
			className="hb-root fixed inset-0 flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:var(--hb-font-size)]"
			data-bg={bg}
			data-theme={theme}
		>
			{status !== "connected" && (
				<div className="hb-status absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 font-sans text-white text-xs">
					{STATUS_LABEL[status]}
				</div>
			)}
			<div
				className={`hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 [mask-image:var(--hb-mask)] ${
					bg === "bubble" ? "gap-1.5" : "gap-1"
				} ${bg === "panel" ? PANEL_CLASSES : ""}`}
			>
				{messages.map((message) => (
					<ChatMessageRow
						bg={bg}
						key={message.id}
						message={message}
						surfaceTone={surfaceTone}
					/>
				))}
			</div>
		</div>
	);
}
