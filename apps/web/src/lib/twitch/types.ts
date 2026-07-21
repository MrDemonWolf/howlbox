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

// The event kinds the overlay can render, and the ?events= tokens.
// Anonymous IRC delivers all of these: subs and raids arrive as
// USERNOTICE, cheers ride a normal message's bits tag, and first-time
// chatters are a tag on the message itself.
export const EVENT_KINDS = [
	"sub",
	"cheer",
	"raid",
	"first",
	"announce",
] as const;

export type ChatEventKind = (typeof EVENT_KINDS)[number];

// Profile pictures are a per-user third-party lookup, so who gets one is
// a choice: nobody, everybody, or only subscribers. "subs" reads the
// subscriber tag already on the message, costing nothing extra, and
// keeps a big channel from fanning out a lookup for every drive-by.
export const AVATAR_MODES = ["off", "all", "subs"] as const;

export type AvatarMode = (typeof AVATAR_MODES)[number];

// An event row is a normal message carrying this extra header line, so
// it inherits the delay buffer, dedupe, max trimming, fade, and emote
// resolution for free.
export interface ChatEvent {
	kind: ChatEventKind;
	// the system line above the message, e.g. "gifted 5 Tier 1 subs"
	text: string;
	// cheermote art for the bits tier, cheers only
	cheermoteUrl?: string;
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
	// resolved profile picture, filled at append time when available
	avatarUrl?: string;
	parts: MessagePart[];
	isAction: boolean;
	// broadcaster or mod: skips the moderation delay
	isPrivileged: boolean;
	// subscriber or founder, straight off the IRC tags; gates avatars=subs.
	// optional so demo and preview fixtures do not have to carry it
	isSubscriber?: boolean;
	timestamp: number;
	// present only on event rows; a raid has no message body, a resub may
	event?: ChatEvent;
}

export type ConnectionStatus =
	| "connecting"
	| "connected"
	| "disconnected"
	| "join_failed";
