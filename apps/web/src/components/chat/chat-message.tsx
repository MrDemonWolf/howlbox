import type { OverlayParams } from "@/lib/overlay/params";
import type { ChatMessageView } from "@/lib/twitch/types";

interface ChatMessageRowProps {
	message: ChatMessageView;
	bg: OverlayParams["bg"];
}

const BUBBLE_CLASSES =
	"w-fit max-w-full rounded-(--hb-radius) border border-(--hb-border) px-2.5 py-1.5 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

export function ChatMessageRow({ message, bg }: ChatMessageRowProps) {
	// bg=off has no surface to supply contrast, so text carries a
	// heavy shadow stack; other modes get the theme's glow (if any)
	const textShadow =
		bg === "off"
			? "[text-shadow:var(--hb-shadow-off)]"
			: "[text-shadow:var(--hb-glow)]";

	return (
		<div
			className={`hb-message [overflow-wrap:anywhere] ${textShadow} ${
				bg === "bubble" ? BUBBLE_CLASSES : ""
			} ${message.isAction ? "italic" : ""}`}
		>
			<span className="hb-name font-semibold" style={{ color: message.color }}>
				{message.displayName}
			</span>
			{!message.isAction && <span className="hb-sep">: </span>}
			{message.isAction && " "}
			<span
				className="hb-text"
				style={message.isAction ? { color: message.color } : undefined}
			>
				{message.parts.map((part, index) => {
					// parts are immutable per message; index keys are stable here
					const key = `${message.id}-${index}`;
					return part.type === "emote" ? (
						<img
							alt={part.name}
							className="hb-emote -my-1 inline-block h-[1.6em] align-middle"
							key={key}
							src={part.url}
							title={part.name}
						/>
					) : (
						<span key={key}>{part.text}</span>
					);
				})}
			</span>
		</div>
	);
}
