import { lazy, Suspense, useEffect } from "react";

import {
	ChatOverlay,
	type ChatOverlayLook,
} from "@/components/chat/chat-overlay";
import { useBadgeMap, useEmoteMap } from "@/hooks/use-emotes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTwitchChat } from "@/hooks/use-twitch-chat";
import { assetScaleFor, type OverlayParams } from "@/lib/overlay/config";
import { KNOWN_BOTS } from "@/lib/twitch/bots";

// Base variables only. The theme chunk is loaded per theme name by
// overlay-main (OBS path); the site previews import themes/index.css
// themselves because they render many themes at once.
import "@/components/chat/overlay.css";

// Separate chunk: only a ?demo source downloads the canned script.
const DemoOverlay = lazy(() => import("@/components/chat/demo-overlay"));

export function OverlayApp({ params }: { params: OverlayParams }) {
	const reducedMotion = useReducedMotion();
	const staticMedia = params.media === "static" || reducedMotion;
	// A ticker is continuous motion by definition, so a reduced-motion
	// preference turns it off rather than getting its own slower variant.
	// It falls back to the normal stack, which in a strip-sized source
	// shows the last message or two.
	const look: ChatOverlayLook = {
		align: params.align,
		animate: params.animate,
		bg: params.bg,
		emoteScale: params.emotescale,
		fadeSeconds: params.fade,
		group: params.group,
		layout: params.layout,
		scroll: reducedMotion ? "off" : params.scroll,
		scrollSpeed: params.scrollspeed,
		showAvatars: params.avatars !== "off",
		showBadges: params.badges,
		showPronouns: params.pronouns,
		showTimestamps: params.timestamps,
		size: params.size,
		theme: params.theme,
		variant: params.variant,
	};

	useEffect(() => {
		document.documentElement.classList.add("hb-overlay");
		return () => {
			document.documentElement.classList.remove("hb-overlay");
		};
	}, []);

	// demo needs no channel, so it is checked before the channel hint
	if (params.demo) {
		return (
			<Suspense fallback={null}>
				<DemoOverlay look={look} params={params} staticMedia={staticMedia} />
			</Suspense>
		);
	}

	if (!params.channel) {
		return (
			<div
				className="hb-status hb-hint absolute top-2 left-2 max-w-[calc(100%-1rem)] rounded-md bg-black/70 px-2 py-1 text-white text-xs [font-family:system-ui,sans-serif]"
				role="alert"
			>
				Add ?channel=your_twitch_name to this URL, for example
				/overlay?channel=xqc&amp;bg=off&amp;theme=wolf. Add &amp;demo=true to
				test placement with sample chat.
			</div>
		);
	}

	return (
		<LiveOverlay
			channel={params.channel}
			look={look}
			params={params}
			staticMedia={staticMedia}
		/>
	);
}

function LiveOverlay({
	channel,
	params,
	look,
	staticMedia,
}: {
	channel: string;
	params: OverlayParams;
	look: ChatOverlayLook;
	staticMedia: boolean;
}) {
	const hiddenLogins = params.hidebots
		? [...KNOWN_BOTS, ...params.hide]
		: params.hide;
	const assetScale = assetScaleFor(params.size, params.emotescale);
	const mediaPreferences = { assetScale, staticMedia };
	const [emotesRef, emotesRevision] = useEmoteMap(
		channel,
		params.refresh,
		mediaPreferences,
	);
	const [badgesRef, badgesRevision] = useBadgeMap(
		params.badges ? channel : undefined,
		params.badgeart,
		params.badgegist,
		params.refresh,
		mediaPreferences,
	);
	const { messages, removeMessage, status } = useTwitchChat(channel, {
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
		mediaRevision: `${emotesRevision}:${badgesRevision}`,
	});

	return (
		<ChatOverlay
			{...look}
			messages={messages}
			onMessageExpired={removeMessage}
			status={status}
		/>
	);
}
