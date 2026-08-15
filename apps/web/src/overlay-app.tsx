import { useEffect } from "react";

import { ChatOverlay } from "@/components/chat/chat-overlay";
import { useBadgeMap, useEmoteMap } from "@/hooks/use-emotes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTwitchChat } from "@/hooks/use-twitch-chat";
import { assetScaleFor, type OverlayParams } from "@/lib/overlay/config";
import { KNOWN_BOTS } from "@/lib/twitch/bots";

// Base variables only. The theme chunk is loaded per theme name by
// overlay-main (OBS path); the site previews import themes/index.css
// themselves because they render many themes at once.
import "@/components/chat/overlay.css";

export function OverlayApp({ params }: { params: OverlayParams }) {
	const hiddenLogins = params.hidebots
		? [...KNOWN_BOTS, ...params.hide]
		: params.hide;
	const reducedMotion = useReducedMotion();
	const assetScale = assetScaleFor(params.size, params.emotescale);
	const staticMedia = params.media === "static" || reducedMotion;
	const mediaPreferences = { assetScale, staticMedia };
	const emotesRef = useEmoteMap(
		params.channel,
		params.refresh,
		mediaPreferences,
	);
	const badgesRef = useBadgeMap(
		params.badges ? params.channel : undefined,
		params.badgeart,
		params.badgegist,
		params.refresh,
		mediaPreferences,
	);
	const { messages, removeMessage, status } = useTwitchChat(params.channel, {
		maxMessages: params.max,
		delaySeconds: params.delay,
		hiddenLogins,
		allowedLogins: params.allow,
		hideCommands: params.hidecommands,
		pronouns: params.pronouns,
		events: params.events,
		avatars: params.avatars,
		emoteScale: assetScale,
		staticMedia,
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
			<div
				className="hb-status hb-hint absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs [font-family:system-ui,sans-serif]"
				role="alert"
			>
				Add ?channel=your_twitch_name to this URL, for example
				/overlay?channel=xqc&amp;bg=off&amp;theme=wolf
			</div>
		);
	}

	return (
		<ChatOverlay
			align={params.align}
			animate={params.animate}
			bg={params.bg}
			emoteScale={params.emotescale}
			group={params.group}
			layout={params.layout}
			fadeSeconds={params.fade}
			messages={messages}
			onMessageExpired={removeMessage}
			showAvatars={params.avatars !== "off"}
			showBadges={params.badges}
			showPronouns={params.pronouns}
			showTimestamps={params.timestamps}
			size={params.size}
			status={status}
			theme={params.theme}
			variant={params.variant}
		/>
	);
}
