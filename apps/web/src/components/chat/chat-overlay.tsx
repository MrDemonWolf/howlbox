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

export function ChatOverlay({ messages, status, bg, theme }: ChatOverlayProps) {
	return (
		<div
			className="hb-root fixed inset-0 flex flex-col justify-end overflow-hidden text-(--hb-text) text-base leading-snug [font-family:var(--hb-font)]"
			data-bg={bg}
			data-theme={theme}
		>
			{status !== "connected" && (
				<div className="hb-status absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 font-sans text-white text-xs">
					{status === "connecting"
						? "connecting to chat"
						: "disconnected, retrying"}
				</div>
			)}
			<div
				className={`hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 ${
					bg === "bubble" ? "gap-1.5" : "gap-1"
				} ${bg === "panel" ? PANEL_CLASSES : ""}`}
			>
				{messages.map((message) => (
					<ChatMessageRow bg={bg} key={message.id} message={message} />
				))}
			</div>
		</div>
	);
}
