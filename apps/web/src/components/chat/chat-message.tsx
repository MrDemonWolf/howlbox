import { type CSSProperties, memo } from "react";

import { groupParts, isEmoteOnly } from "@/lib/emotes/resolve";
import type { OverlayParams } from "@/lib/overlay/params";
import { readableUserColor, userColorOutline } from "@/lib/twitch/colors";
import { isStandaloneEvent } from "@/lib/twitch/events";
import type { ChatMessageView } from "@/lib/twitch/types";

interface ChatMessageRowProps {
	message: ChatMessageView;
	bg: OverlayParams["bg"];
	surfaceColor?: string;
	showBadges: boolean;
	showPronouns: boolean;
	showTimestamps: boolean;
	showAvatars: boolean;
	animate: boolean;
	fadeSeconds: number;
	onExpire?: (id: string) => void;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

const BUBBLE_CLASSES =
	"w-fit max-w-full rounded-(--hb-radius) border border-(--hb-border) px-2.5 py-1.5 [background:var(--hb-bubble-surface,var(--hb-surface))] [box-shadow:var(--hb-bubble-shadow,var(--hb-shadow))]";

// --hb-emote-scale is the OBS Custom CSS hook and --hb-emote-jumbo is the
// per-row ?emotescale gate, 1 unless the row is emote-only. Multiplying
// them keeps a Custom CSS scale working on jumbo rows too.
const EMOTE_CLASSES =
	"hb-emote -my-1 inline-block h-[calc(1.6em*var(--hb-emote-scale,1)*var(--hb-emote-jumbo,1))] w-auto align-middle";

// text badge (pronouns) sized to sit with the image badges: same height,
// hairline pill in the theme's border/text colors
const TEXT_BADGE_CLASSES =
	"hb-pronoun -my-0.5 mr-1 inline-flex h-[1.15em] items-center rounded-[0.35em] border border-(--hb-border) px-[0.35em] align-middle text-[0.8em] leading-none";

// profile picture: shape and ring come from the theme, so retro themes
// get a square and the soft ones get a circle
const AVATAR_CLASSES =
	"hb-avatar -my-0.5 mr-1 inline-block aspect-square h-(--hb-avatar-size) rounded-(--hb-avatar-radius) object-cover align-middle [box-shadow:var(--hb-avatar-ring)]";

// The system line on an event row (sub, raid, cheer, first message).
// No trailing margin: the line is always followed either by the ": "
// separator or by nothing, and a margin renders as "7 in a row : text".
const EVENT_LINE_CLASSES =
	"hb-event-line font-semibold text-[color:var(--hb-event-accent)]";

const CHEERMOTE_CLASSES =
	"hb-cheermote -my-1 mr-0.5 inline-block h-[calc(1.6em*var(--hb-emote-scale,1)*var(--hb-emote-jumbo,1))] align-middle";

// memoized: at ?max=200 every incoming message would otherwise
// re-render all 200 rows
export const ChatMessageRow = memo(function ChatMessageRow({
	message,
	bg,
	surfaceColor,
	showBadges,
	showPronouns,
	showTimestamps,
	showAvatars,
	animate,
	fadeSeconds,
	onExpire,
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
	const color = readableUserColor(message.color, surfaceColor);
	const nameStyle = {
		color,
		...(bg === "off" ? { textShadow: userColorOutline(color) } : {}),
	};
	// a sub or raid line names everyone involved in its own sentence, so
	// it drops the author header; a cheer or first message decorates a
	// real message and keeps it
	const standalone = message.event
		? isStandaloneEvent(message.event.kind)
		: false;
	const showAvatar = showAvatars && Boolean(message.avatarUrl);
	const hasBody = message.parts.some(
		(part) => part.type !== "text" || part.text.trim() !== "",
	);

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
	const className = [
		"hb-message [overflow-wrap:anywhere]",
		textShadow,
		bg === "bubble" ? BUBBLE_CLASSES : undefined,
		message.isAction ? "italic" : undefined,
	]
		.filter(Boolean)
		.join(" ");

	// The ?emotescale jumbo, gated to rows whose body is nothing but art.
	// HbRoot puts the configured multiplier on --hb-emote-boost; this
	// hands it to --hb-emote-jumbo, which the emote and cheermote heights
	// multiply by the --hb-emote-scale Custom CSS hook. Rows with words in
	// them never see it, so their emotes stay at 1.6em.
	const emoteOnly = isEmoteOnly(
		message.parts,
		Boolean(message.event?.cheermoteUrl),
	);
	const style: CSSProperties | undefined =
		animation || emoteOnly
			? ({
					animation,
					...(emoteOnly
						? { "--hb-emote-jumbo": "var(--hb-emote-boost,1)" }
						: {}),
				} as CSSProperties)
			: undefined;

	return (
		<div
			className={className}
			data-emote-only={emoteOnly ? "" : undefined}
			data-event={message.event?.kind}
			style={style}
			onAnimationEnd={
				onExpire && fadeSeconds > 0
					? (event) => {
							if (
								event.currentTarget === event.target &&
								event.animationName === "hb-fade-out"
							) {
								onExpire(message.id);
							}
						}
					: undefined
			}
		>
			{showTimestamps && (
				<span className="hb-time mr-1 align-middle text-[0.78em] opacity-60">
					{formatTime(message.timestamp)}
				</span>
			)}
			{showAvatar && (
				<img
					alt=""
					className={AVATAR_CLASSES}
					decoding="async"
					height={70}
					loading="lazy"
					referrerPolicy="no-referrer"
					src={message.avatarUrl}
					width={70}
				/>
			)}
			{badges.map((badge, index) =>
				badge.kind === "image" ? (
					<img
						alt=""
						className="hb-badge -my-0.5 mr-1 inline-block h-[1.15em] align-middle"
						decoding="async"
						key={`${message.id}-badge-${index}`}
						referrerPolicy="no-referrer"
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
			{!standalone && (
				<span className="hb-name font-semibold" style={nameStyle}>
					{message.displayName}
				</span>
			)}
			{message.event?.cheermoteUrl && (
				<img
					alt=""
					className={CHEERMOTE_CLASSES}
					decoding="async"
					referrerPolicy="no-referrer"
					src={message.event.cheermoteUrl}
				/>
			)}
			{message.event && (
				<span className={EVENT_LINE_CLASSES}>
					{standalone ? message.event.text : ` ${message.event.text}`}
				</span>
			)}
			{/* an event row with no body has nothing to separate: a raid
			    never has one, and a cheer that was only "Cheer100" tokens
			    has had them stripped */}
			{!message.isAction && (message.event ? hasBody : true) && (
				<span className="hb-sep">: </span>
			)}
			{message.isAction && " "}
			<span
				className="hb-text"
				style={message.isAction ? nameStyle : undefined}
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
								decoding="async"
								key={key}
								referrerPolicy="no-referrer"
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
								decoding="async"
								referrerPolicy="no-referrer"
								src={group.part.url}
								title={group.part.name}
							/>
							{group.overlays.map((overlay, overlayIndex) => (
								<img
									alt={overlay.name}
									className="absolute inset-0 m-auto h-full w-auto"
									decoding="async"
									key={`${key}-zw-${overlayIndex}`}
									referrerPolicy="no-referrer"
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
