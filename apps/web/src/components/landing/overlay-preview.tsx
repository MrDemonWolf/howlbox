import { cn } from "@howlbox/ui/lib/utils";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { HbRoot } from "@/components/chat/hb-root";
import { MessageList } from "@/components/chat/message-list";
import { useDemoStream } from "@/components/landing/demo-messages";
import type { BgMode, MediaMode, Theme } from "@/lib/overlay/params";
import type {
	AvatarMode,
	ChatEventKind,
	ChatMessageView,
} from "@/lib/twitch/types";

import "@/components/chat/overlay.css";

const OBS_WIDTH = 480;
const OBS_HEIGHT = 800;

interface OverlayPreviewProps {
	theme: Theme;
	bg: BgMode;
	showBadges: boolean;
	showPronouns?: boolean;
	showTimestamps: boolean;
	showAvatars?: boolean;
	avatarMode?: AvatarMode;
	animate: boolean;
	fadeSeconds: number;
	size?: number;
	maxMessages?: number;
	events?: readonly ChatEventKind[];
	mediaMode?: MediaMode;
	logicalViewport?: boolean;
	className?: string;
	// "checker" shows the transparency checkerboard (honest OBS view);
	// "gameplay" fakes a game feed to sell legibility over video.
	backdrop?: "checker" | "gameplay";
}

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

// Wraps the shared MessageList in a card (absolute, not fixed) layered
// over a gameplay stand-in, so bg=off transparency reads honestly.
export function OverlayPreview({
	theme,
	bg,
	showBadges,
	showPronouns = false,
	showTimestamps,
	showAvatars = false,
	avatarMode,
	animate,
	fadeSeconds,
	size = 100,
	maxMessages = 8,
	events,
	mediaMode = "animated",
	logicalViewport = false,
	className = "h-105",
	backdrop = "gameplay",
}: OverlayPreviewProps) {
	const { messages, removeMessage } = useDemoStream({
		events,
		limit: maxMessages,
	});
	const { frameRef, scale } = useLogicalScale(logicalViewport);
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
			<HbRoot bg={bg} className="absolute inset-0" size={size} theme={theme}>
				<MessageList
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					messages={previewMessages}
					onMessageExpired={removeMessage}
					showAvatars={
						avatarMode === undefined ? showAvatars : avatarMode !== "off"
					}
					showBadges={showBadges}
					showPronouns={showPronouns}
					showTimestamps={showTimestamps}
					theme={theme}
				/>
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
					className="absolute top-1/2 left-1/2 h-[800px] w-[480px] origin-center"
					style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
				>
					{preview}
				</div>
			) : (
				preview
			)}
		</div>
	);
}
