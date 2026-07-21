import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

import { HbRoot } from "./hb-root";
import { MessageList } from "./message-list";

interface ChatOverlayProps {
	messages: ChatMessageView[];
	status: ConnectionStatus;
	bg: OverlayParams["bg"];
	theme: OverlayParams["theme"];
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	showAvatars: boolean;
	animate: boolean;
	fadeSeconds: number;
	size: number;
}

const STATUS_LABEL: Record<Exclude<ConnectionStatus, "connected">, string> = {
	connecting: "connecting to chat",
	disconnected: "disconnected, retrying",
	join_failed: "could not join channel",
};

export function ChatOverlay({
	messages,
	status,
	bg,
	theme,
	showBadges,
	showPronouns,
	showTimestamps,
	showAvatars,
	animate,
	fadeSeconds,
	size,
}: ChatOverlayProps) {
	return (
		<HbRoot bg={bg} className="fixed inset-0" size={size} theme={theme}>
			{status !== "connected" && (
				<div className="hb-status absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 font-sans text-white text-xs">
					{STATUS_LABEL[status]}
				</div>
			)}
			<MessageList
				animate={animate}
				bg={bg}
				fadeSeconds={fadeSeconds}
				messages={messages}
				showAvatars={showAvatars}
				showBadges={showBadges}
				showPronouns={showPronouns}
				showTimestamps={showTimestamps}
				theme={theme}
			/>
		</HbRoot>
	);
}
