import type { ChatMessageView } from "@/lib/twitch/types";

interface ChatMessageRowProps {
	message: ChatMessageView;
}

export function ChatMessageRow({ message }: ChatMessageRowProps) {
	return (
		<div className="hb-message" data-action={message.isAction || undefined}>
			<span className="hb-name" style={{ color: message.color }}>
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
							key={key}
							alt={part.name}
							className="hb-emote"
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
