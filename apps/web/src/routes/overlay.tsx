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
	const emotesRef = useEmoteMap(params.channel, params.refresh);
	const badgesRef = useBadgeMap(
		params.channel,
		params.badgeart,
		params.badgegist,
		params.refresh,
	);
	const { messages, status } = useTwitchChat(params.channel, {
		maxMessages: params.max,
		delaySeconds: params.delay,
		hiddenLogins,
		allowedLogins: params.allow,
		hideCommands: params.hidecommands,
		pronouns: params.pronouns,
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
			animate={params.animate}
			bg={params.bg}
			fadeSeconds={params.fade}
			messages={messages}
			showBadges={params.badges}
			showPronouns={params.pronouns}
			showTimestamps={params.timestamps}
			status={status}
			theme={params.theme}
		/>
	);
}
