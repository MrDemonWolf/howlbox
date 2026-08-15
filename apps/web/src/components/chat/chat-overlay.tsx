import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView, ConnectionStatus } from "@/lib/twitch/types";

import { HbRoot } from "./hb-root";
import { MessageList } from "./message-list";

interface ChatOverlayProps {
	messages: ChatMessageView[];
	status: ConnectionStatus;
	bg: OverlayParams["bg"];
	theme: OverlayParams["theme"];
	variant: OverlayParams["variant"];
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	showAvatars: boolean;
	animate: boolean;
	fadeSeconds: number;
	size: number;
	emoteScale: number;
	onMessageExpired?: (id: string) => void;
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
	variant,
	showBadges,
	showPronouns,
	showTimestamps,
	showAvatars,
	animate,
	fadeSeconds,
	size,
	emoteScale,
	onMessageExpired,
}: ChatOverlayProps) {
	return (
		<HbRoot
			bg={bg}
			className="fixed inset-0"
			emoteScale={emoteScale}
			size={size}
			theme={theme}
			variant={variant}
		>
			{status !== "connected" && (
				<div
					className="hb-status absolute top-2 left-2 rounded-md bg-black/80 px-2 py-1 text-white text-xs [font-family:system-ui,sans-serif]"
					role={status === "join_failed" ? "alert" : "status"}
				>
					{STATUS_LABEL[status]}
				</div>
			)}
			<MessageList
				animate={animate}
				bg={bg}
				fadeSeconds={fadeSeconds}
				messages={messages}
				onMessageExpired={onMessageExpired}
				showAvatars={showAvatars}
				showBadges={showBadges}
				showPronouns={showPronouns}
				showTimestamps={showTimestamps}
				theme={theme}
				variant={variant}
			/>
		</HbRoot>
	);
}
