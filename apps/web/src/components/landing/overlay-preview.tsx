import { cn } from "@howlbox/ui/lib/utils";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { HbRoot } from "@/components/chat/hb-root";
import { MessageList } from "@/components/chat/message-list";
import { useDemoStream } from "@/components/landing/demo-messages";
import { useBadgeMap, useEmoteMap } from "@/hooks/use-emotes";
import { useTwitchChat } from "@/hooks/use-twitch-chat";
import type {
	Align,
	BgMode,
	Layout,
	MediaMode,
	ScrollMode,
	Theme,
} from "@/lib/overlay/params";
import { assetScaleFor, isValidLogin } from "@/lib/overlay/params";
import type { OverlayConfig } from "@/lib/overlay/url";
import { KNOWN_BOTS } from "@/lib/twitch/bots";
import type {
	AvatarMode,
	ChatEventKind,
	ChatMessageView,
	ConnectionStatus,
} from "@/lib/twitch/types";

import "@/components/chat/overlay.css";
import "@/components/chat/themes/index.css";

export const OBS_WIDTH = 480;
export const OBS_HEIGHT = 800;
export const OBS_DIMENSIONS = `${OBS_WIDTH} × ${OBS_HEIGHT}`;

interface OverlayPreviewProps {
	theme: Theme;
	variant?: string;
	layout?: Layout;
	align?: Align;
	scroll?: ScrollMode;
	scrollSpeed?: number;
	group?: boolean;
	bg: BgMode;
	showBadges: boolean;
	showPronouns?: boolean;
	showTimestamps: boolean;
	showAvatars?: boolean;
	avatarMode?: AvatarMode;
	animate: boolean;
	fadeSeconds: number;
	size?: number;
	emoteScale?: number;
	maxMessages?: number;
	events?: readonly ChatEventKind[];
	mediaMode?: MediaMode;
	logicalViewport?: boolean;
	className?: string;
	// "checker" shows the transparency checkerboard (honest OBS view);
	// "gameplay" fakes a game feed to sell legibility over video.
	backdrop?: "checker" | "gameplay";
	// Live mode is opt-in and only connects while a valid channel is set.
	liveChat?: boolean;
	liveConfig?: OverlayConfig;
}

interface PreviewMessageProps {
	align: Align;
	animate: boolean;
	bg: BgMode;
	fadeSeconds: number;
	group: boolean;
	showAvatars: boolean;
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	scrollSpeed: number;
	theme: Theme;
	ticker: boolean;
	variant: string;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
	connecting: "connecting to chat",
	connected: "connected to chat",
	disconnected: "disconnected, retrying",
	join_failed: "could not join channel",
};

function useLogicalScale(enabled: boolean) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		if (!enabled) {
			return;
		}
		const frame = frameRef.current;
		if (!frame) {
			return;
		}
		const measure = () => {
			setScale(
				Math.min(
					frame.clientWidth / OBS_WIDTH,
					frame.clientHeight / OBS_HEIGHT,
				),
			);
		};
		measure();
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", measure);
			return () => window.removeEventListener("resize", measure);
		}
		const observer = new ResizeObserver(measure);
		observer.observe(frame);
		return () => observer.disconnect();
	}, [enabled]);

	return { frameRef, scale };
}

function staticMedia(message: ChatMessageView): ChatMessageView {
	const parts = message.parts.map((part) =>
		part.type === "emote"
			? {
					...part,
					url: part.url.replace("/default/dark/", "/static/dark/"),
				}
			: part,
	);
	const event = message.event?.cheermoteUrl
		? {
				...message.event,
				cheermoteUrl: message.event.cheermoteUrl
					.replace("/animated/", "/static/")
					.replace(/\.gif$/, ".png"),
			}
		: message.event;
	return { ...message, event, parts };
}

function DemoPreviewMessages({
	events,
	limit,
	mediaMode,
	avatarMode,
	showAvatars,
	presentation,
}: {
	events?: readonly ChatEventKind[];
	limit: number;
	mediaMode: MediaMode;
	avatarMode?: AvatarMode;
	showAvatars: boolean;
	presentation: PreviewMessageProps;
}) {
	const { messages, removeMessage } = useDemoStream({ events, limit });
	const previewMessages = useMemo(
		() =>
			messages.map((message) => {
				const avatarAllowed =
					avatarMode === undefined ||
					avatarMode === "all" ||
					(avatarMode === "subs" && message.isSubscriber);
				const withAvatar = avatarAllowed
					? message
					: { ...message, avatarUrl: undefined };
				return mediaMode === "static" ? staticMedia(withAvatar) : withAvatar;
			}),
		[avatarMode, mediaMode, messages],
	);

	return (
		<MessageList
			{...presentation}
			messages={previewMessages}
			onMessageExpired={removeMessage}
			showAvatars={
				avatarMode === undefined ? showAvatars : avatarMode !== "off"
			}
		/>
	);
}

function LivePreviewMessages({
	config,
	presentation,
}: {
	config: OverlayConfig;
	presentation: PreviewMessageProps;
}) {
	const assetScale = assetScaleFor(config.size, config.emotescale);
	const staticAssets = config.media === "static";
	const preferences = { assetScale, staticMedia: staticAssets };
	const [emotesRef, emotesRevision] = useEmoteMap(
		config.channel,
		config.refresh,
		preferences,
	);
	const [badgesRef, badgesRevision] = useBadgeMap(
		config.badges ? config.channel : undefined,
		config.badgeart,
		config.badgegist,
		config.refresh,
		preferences,
	);
	const { messages, removeMessage, status } = useTwitchChat(config.channel, {
		maxMessages: config.max,
		delaySeconds: config.delay,
		hiddenLogins: config.hidebots
			? [...KNOWN_BOTS, ...config.hide]
			: config.hide,
		allowedLogins: config.allow,
		hideCommands: config.hidecommands,
		pronouns: config.pronouns,
		events: config.events,
		avatars: config.avatars,
		emoteScale: assetScale,
		staticMedia: staticAssets,
		emotesRef,
		badgesRef,
		mediaRevision: `${emotesRevision}:${badgesRevision}`,
	});

	return (
		<>
			<div
				className="hb-status absolute top-2 left-2 rounded-md bg-black/80 px-2 py-1 text-white text-xs [font-family:system-ui,sans-serif]"
				role={status === "join_failed" ? "alert" : "status"}
			>
				{STATUS_LABEL[status]}
			</div>
			<MessageList
				{...presentation}
				messages={messages}
				onMessageExpired={removeMessage}
			/>
		</>
	);
}

// Wraps the shared MessageList in a card (absolute, not fixed) layered
// over a gameplay stand-in, so bg=off transparency reads honestly.
export function OverlayPreview({
	theme,
	variant = "",
	layout = "inline",
	align = "left",
	scroll = "off",
	scrollSpeed = 1,
	group = false,
	bg,
	showBadges,
	showPronouns = false,
	showTimestamps,
	showAvatars = false,
	avatarMode,
	animate,
	fadeSeconds,
	size = 100,
	emoteScale = 1,
	maxMessages = 8,
	events,
	mediaMode = "animated",
	logicalViewport = false,
	className = "h-105",
	backdrop = "gameplay",
	liveChat = false,
	liveConfig,
}: OverlayPreviewProps) {
	const { frameRef, scale } = useLogicalScale(logicalViewport);
	const presentation: PreviewMessageProps = {
		align,
		animate,
		bg,
		fadeSeconds,
		group,
		showAvatars: avatarMode === undefined ? showAvatars : avatarMode !== "off",
		showBadges,
		showPronouns,
		showTimestamps,
		scrollSpeed,
		theme,
		ticker: scroll === "ticker",
		variant,
	};
	const canConnectLive =
		liveChat && liveConfig && isValidLogin(liveConfig.channel);
	const preview = (
		<>
			<div
				className={cn(
					"absolute inset-0",
					backdrop === "checker"
						? "hb-checker"
						: "bg-[linear-gradient(135deg,#1b2735_0%,#2d4a3e_38%,#6b4f2e_72%,#3d2b4f_100%)]",
				)}
			/>
			<HbRoot
				align={align}
				bg={bg}
				className="absolute inset-0"
				emoteScale={emoteScale}
				layout={layout}
				scroll={scroll}
				size={size}
				theme={theme}
				variant={variant}
			>
				{liveChat ? (
					canConnectLive && liveConfig ? (
						<LivePreviewMessages
							config={liveConfig}
							presentation={presentation}
						/>
					) : (
						<div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white">
							Enter a valid Twitch channel above to preview live chat.
						</div>
					)
				) : (
					<DemoPreviewMessages
						avatarMode={avatarMode}
						events={events}
						limit={maxMessages}
						mediaMode={mediaMode}
						presentation={presentation}
						showAvatars={showAvatars}
					/>
				)}
			</HbRoot>
		</>
	);

	return (
		<div
			className={cn(
				"hb-hairline relative overflow-hidden rounded-2xl border bg-[color:var(--site-surface)] shadow-lg",
				className,
			)}
			ref={frameRef}
		>
			{logicalViewport ? (
				<div
					className="absolute top-1/2 left-1/2 origin-center"
					style={{
						height: OBS_HEIGHT,
						transform: `translate(-50%, -50%) scale(${scale})`,
						width: OBS_WIDTH,
					}}
				>
					{preview}
				</div>
			) : (
				preview
			)}
		</div>
	);
}
