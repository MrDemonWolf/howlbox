import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

import { ChatMessageRow } from "./chat-message";

interface ChatOverlayProps {
	messages: ChatMessageView[];
	status: ConnectionStatus;
	bg: OverlayParams["bg"];
	theme: OverlayParams["theme"];
}

export function ChatOverlay({ messages, status, bg, theme }: ChatOverlayProps) {
	return (
		<div className="hb-root" data-bg={bg} data-theme={theme}>
			{status !== "connected" && (
				<div className="hb-status">
					{status === "connecting"
						? "connecting to chat"
						: "disconnected, retrying"}
				</div>
			)}
			<div className="hb-messages">
				{messages.map((message) => (
					<ChatMessageRow key={message.id} message={message} />
				))}
			</div>
		</div>
	);
}
