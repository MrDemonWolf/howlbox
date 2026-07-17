import { cn } from "@howlbox/ui/lib/utils";
import { memo } from "react";

import type { OverlayParams } from "@/lib/overlay/params";
import { readableUserColor } from "@/lib/twitch/colors";
import type { ChatMessageView, MessagePart } from "@/lib/twitch/types";

interface ChatMessageRowProps {
	message: ChatMessageView;
	bg: OverlayParams["bg"];
	surfaceTone: "dark" | "light";
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	animate: boolean;
	fadeSeconds: number;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

const BUBBLE_CLASSES =
	"w-fit max-w-full rounded-(--hb-radius) border border-(--hb-border) px-2.5 py-1.5 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

const EMOTE_CLASSES =
	"hb-emote -my-1 inline-block h-[1.6em] min-w-[1.6em] align-middle";

// text badge (pronouns) sized to sit with the image badges: same height,
// hairline pill in the theme's border/text colors
const TEXT_BADGE_CLASSES =
	"hb-pronoun -my-0.5 mr-1 inline-flex h-[1.15em] items-center rounded-[0.35em] border border-(--hb-border) px-[0.35em] align-middle text-[0.8em] leading-none";

type EmotePart = Extract<MessagePart, { type: "emote" }>;

interface RenderGroup {
	part: MessagePart;
	// 7TV zero-width emotes stack over the preceding emote
	overlays: EmotePart[];
}

function groupParts(parts: MessagePart[]): RenderGroup[] {
	const groups: RenderGroup[] = [];
	for (const part of parts) {
		const last = groups.at(-1);
		if (
			part.type === "emote" &&
			part.zeroWidth &&
			last?.part.type === "emote"
		) {
			last.overlays.push(part);
			continue;
		}
		groups.push({ part, overlays: [] });
	}
	return groups;
}

// memoized: at ?max=200 every incoming message would otherwise
// re-render all 200 rows
export const ChatMessageRow = memo(function ChatMessageRow({
	message,
	bg,
	surfaceTone,
	showBadges,
	showPronouns,
	showTimestamps,
	animate,
	fadeSeconds,
}: ChatMessageRowProps) {
	// image badges follow the badges toggle, text/pronoun badges follow
	// their own; both share the row in resolved order
	const badges = message.renderBadges.filter((badge) =>
		badge.kind === "image" ? showBadges : showPronouns,
	);
	// bg=off has no surface to supply contrast, so text carries a
	// heavy shadow stack; other modes get the theme's glow (if any)
	const textShadow =
		bg === "off"
			? "[text-shadow:var(--hb-shadow-off)]"
			: "[text-shadow:var(--hb-glow)]";
	const color = readableUserColor(message.color, surfaceTone);

	// CSS-only entrance + auto-hide: animation clocks keep running
	// while OBS hides the source, unlike JS timers
	const animation =
		[
			animate ? "hb-msg-in 220ms ease-out" : null,
			fadeSeconds > 0
				? `hb-fade-out 600ms ease ${fadeSeconds}s forwards`
				: null,
		]
			.filter(Boolean)
			.join(", ") || undefined;

	return (
		<div
			className={cn(
				"hb-message [overflow-wrap:anywhere]",
				textShadow,
				bg === "bubble" && BUBBLE_CLASSES,
				message.isAction && "italic",
			)}
			style={animation ? { animation } : undefined}
		>
			{showTimestamps && (
				<span className="hb-time mr-1 align-middle text-[0.78em] opacity-60">
					{formatTime(message.timestamp)}
				</span>
			)}
			{badges.map((badge, index) =>
				badge.kind === "image" ? (
					<img
						alt=""
						className="hb-badge -my-0.5 mr-1 inline-block h-[1.15em] align-middle"
						key={`${message.id}-badge-${index}`}
						src={badge.url}
					/>
				) : (
					<span
						className={TEXT_BADGE_CLASSES}
						key={`${message.id}-badge-${index}`}
					>
						{badge.text}
					</span>
				),
			)}
			<span className="hb-name font-semibold" style={{ color }}>
				{message.displayName}
			</span>
			{!message.isAction && <span className="hb-sep">: </span>}
			{message.isAction && " "}
			<span
				className="hb-text"
				style={message.isAction ? { color } : undefined}
			>
				{groupParts(message.parts).map((group, index) => {
					// parts are immutable per message; index keys are stable here
					const key = `${message.id}-${index}`;
					if (group.part.type === "text") {
						return <span key={key}>{group.part.text}</span>;
					}
					if (group.overlays.length === 0) {
						return (
							<img
								alt={group.part.name}
								className={EMOTE_CLASSES}
								key={key}
								src={group.part.url}
								title={group.part.name}
							/>
						);
					}
					return (
						<span className="relative inline-block align-middle" key={key}>
							<img
								alt={group.part.name}
								className={EMOTE_CLASSES}
								src={group.part.url}
								title={group.part.name}
							/>
							{group.overlays.map((overlay, overlayIndex) => (
								<img
									alt={overlay.name}
									className="absolute inset-0 m-auto h-full w-auto"
									key={`${key}-zw-${overlayIndex}`}
									src={overlay.url}
									title={overlay.name}
								/>
							))}
						</span>
					);
				})}
			</span>
		</div>
	);
});
