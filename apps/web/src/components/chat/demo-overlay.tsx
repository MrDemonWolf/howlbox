import type { OverlayParams } from "@/lib/overlay/config";

import { ChatOverlay, type ChatOverlayLook } from "./chat-overlay";
import { useDemoStream } from "./demo-messages";

// ?demo: the canned script instead of a Twitch connection, so a source
// can be placed, sized and styled in OBS before chat is moving. Loaded
// as its own chunk; a normal overlay never downloads the script.
// Presentation params (theme, size, layout, max, fade, events, avatars,
// media) all apply. Chat filters do not: there is nothing to moderate.
export default function DemoOverlay({
	params,
	look,
	staticMedia,
}: {
	params: OverlayParams;
	look: ChatOverlayLook;
	staticMedia: boolean;
}) {
	const { messages, removeMessage } = useDemoStream({
		limit: params.max,
		initial: Number.POSITIVE_INFINITY,
		events: params.events,
		avatarMode: params.avatars,
		staticMedia,
	});

	return (
		<ChatOverlay
			{...look}
			messages={messages}
			onMessageExpired={removeMessage}
			status="connected"
		/>
	);
}
