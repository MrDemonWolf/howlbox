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
			notice={
				// A source left on ?demo by mistake would otherwise pass for a
				// real chat on stream. Part of the hb-* Custom CSS contract, so
				// .hb-demo-tag { display: none } hides it deliberately.
				// It sits in the top corner away from the edge rows hug, where
				// short messages leave the most empty space.
				<div
					className={`hb-demo-tag pointer-events-none absolute top-2 z-10 ${look.align === "right" ? "left-2" : "right-2"} flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1 text-white text-xs [font-family:system-ui,sans-serif]`}
				>
					<span
						aria-hidden="true"
						className="size-1.5 rounded-full bg-amber-400"
					/>
					Sample chat. Remove demo from the URL to go live.
				</div>
			}
			onMessageExpired={removeMessage}
			status="connected"
		/>
	);
}
