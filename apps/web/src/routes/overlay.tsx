import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { ChatOverlay } from "@/components/chat/chat-overlay";
import { useBadgeMap, useEmoteMap } from "@/hooks/use-emotes";
import { useTwitchChat } from "@/hooks/use-twitch-chat";
import { overlayParamsSchema } from "@/lib/overlay/params";
import { KNOWN_BOTS } from "@/lib/twitch/bots";

import "@fontsource/press-start-2p/index.css";
import "@/components/chat/overlay.css";

export const Route = createFileRoute("/overlay")({
	validateSearch: (search) => overlayParamsSchema.parse(search),
	component: OverlayPage,
});

function OverlayPage() {
	const params = Route.useSearch();
	const hiddenLogins = params.hidebots
		? [...KNOWN_BOTS, ...params.hide]
		: params.hide;
	const emotesRef = useEmoteMap(params.channel);
	const badgesRef = useBadgeMap(params.channel);
	const { messages, status } = useTwitchChat(params.channel, {
		maxMessages: params.max,
		delaySeconds: params.delay,
		hiddenLogins,
		emotesRef,
		badgesRef,
	});

	useEffect(() => {
		document.documentElement.classList.add("hb-overlay");
		return () => {
			document.documentElement.classList.remove("hb-overlay");
		};
	}, []);

	if (!params.channel) {
		return (
			<div className="hb-hint p-4 font-sans text-neutral-400 text-sm">
				Add ?channel=your_twitch_name to this URL, for example
				/overlay?channel=xqc&bg=off&theme=wolf
			</div>
		);
	}

	return (
		<ChatOverlay
			messages={messages}
			status={status}
			bg={params.bg}
			theme={params.theme}
		/>
	);
}
