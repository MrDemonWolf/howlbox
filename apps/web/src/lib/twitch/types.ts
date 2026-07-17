export type MessagePart =
	| { type: "text"; text: string }
	| {
			type: "emote";
			name: string;
			url: string;
			// 7TV overlay emotes render stacked on the previous emote
			zeroWidth?: boolean;
	  };

export interface ChatBadge {
	set: string;
	version: string;
}

// A resolved badge ready to render: either a Twitch/channel image badge
// or a text badge (pronouns). The badge renderer switches on `kind`, so
// both ride the same row before the name.
export type RenderBadge =
	| { kind: "image"; url: string }
	| { kind: "text"; text: string };

export interface ChatMessageView {
	id: string;
	channelId: string | null;
	login: string;
	displayName: string;
	color: string;
	badges: ChatBadge[];
	// resolved render badges (image + text/pronoun), filled at append
	// time when available
	renderBadges: RenderBadge[];
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
