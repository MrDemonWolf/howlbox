export type MessagePart =
	| { type: "text"; text: string }
	| { type: "emote"; name: string; id: string; url: string };

export interface ChatBadge {
	set: string;
	version: string;
}

export interface ChatMessageView {
	id: string;
	channelId: string | null;
	login: string;
	displayName: string;
	color: string;
	badges: ChatBadge[];
	parts: MessagePart[];
	isAction: boolean;
	// broadcaster or mod: skips the moderation delay
	isPrivileged: boolean;
	timestamp: number;
}

export type ConnectionStatus =
	| "connecting"
	| "connected"
	| "disconnected"
	| "join_failed";
