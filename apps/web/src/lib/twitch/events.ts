// Event line text, built from the USERNOTICE info objects twurple hands
// us. Anonymous IRC carries all of this: subs, gift subs, raids and
// announcements are USERNOTICE, and cheers ride the bits tag on a normal
// message. Nothing here touches the network or the DOM, so every line
// below is checkable in isolation (see events.test.ts).

import type { ChatEvent, ChatEventKind } from "./types";

// Two shapes of event row. An attached event decorates a real message,
// so the row still renders avatar, badges, name and body with the event
// line above it. A standalone event has no author line of its own: the
// text is a whole sentence naming everyone involved, because "gifted a
// sub to bob" reads wrong under a separate name header.
const ATTACHED_KINDS = new Set<ChatEventKind>(["cheer", "first", "announce"]);

export function isStandaloneEvent(kind: ChatEventKind): boolean {
	return !ATTACHED_KINDS.has(kind);
}

// Plan ids arrive as "1000"/"2000"/"3000", or "Prime" for a Prime sub.
const PLAN_LABEL: Record<string, string> = {
	"1000": "Tier 1",
	"2000": "Tier 2",
	"3000": "Tier 3",
	Prime: "Prime",
};

export function planLabel(plan: string): string {
	return PLAN_LABEL[plan] ?? "Tier 1";
}

// Twitch's global cheermote tiers. A cheer of N bits renders the highest
// tier it reaches, so 1500 bits shows the 1000 art.
const CHEER_TIERS = [10000, 5000, 1000, 100, 1] as const;

export function cheerTier(bits: number): number {
	return CHEER_TIERS.find((tier) => bits >= tier) ?? 1;
}

// Global cheermote art, no token needed. Channel-custom cheer prefixes
// would need Helix, so those fall back to the plain bits count.
export function cheermoteUrl(bits: number, dark = true): string {
	const theme = dark ? "dark" : "light";
	return `https://static-cdn.jtvnw.net/bits/${theme}/animated/${cheerTier(bits)}/2.gif`;
}

function plural(count: number, word: string): string {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// A new sub. months is 1 here; the tier is what matters.
export function describeSub(name: string, plan: string): ChatEvent {
	return { kind: "sub", text: `${name} subscribed with ${planLabel(plan)}` };
}

// A resub. streak is only sent when the user chose to share it.
export function describeResub(
	name: string,
	plan: string,
	months: number,
	streak?: number,
): ChatEvent {
	const base = `${name} resubscribed with ${planLabel(plan)} for ${plural(months, "month")}`;
	return {
		kind: "sub",
		text: streak ? `${base}, ${streak} in a row` : base,
	};
}

// A single gifted sub. The gifter is absent on an anonymous gift.
export function describeSubGift(
	plan: string,
	recipient: string,
	gifter?: string,
	giftDuration = 1,
): ChatEvent {
	const months = giftDuration > 1 ? ` (${plural(giftDuration, "month")})` : "";
	return {
		kind: "sub",
		text: `${gifter ?? "An anonymous gifter"} gifted a ${planLabel(plan)} sub to ${recipient}${months}`,
	};
}

// A mass gift ("gifted 5 subs to the community").
export function describeCommunitySub(
	plan: string,
	count: number,
	gifter?: string,
): ChatEvent {
	return {
		kind: "sub",
		text: `${gifter ?? "An anonymous gifter"} gifted ${plural(count, `${planLabel(plan)} sub`)} to the community`,
	};
}

// Prime sub converted to a paid one.
export function describePrimeUpgrade(name: string, plan: string): ChatEvent {
	return {
		kind: "sub",
		text: `${name} converted their Prime sub to ${planLabel(plan)}`,
	};
}

// A gifted sub continued by the recipient at their own expense.
export function describeGiftUpgrade(name: string, gifter?: string): ChatEvent {
	return {
		kind: "sub",
		text: gifter
			? `${name} continued their gift sub from ${gifter}`
			: `${name} continued their gift sub`,
	};
}

export function describeRaid(raider: string, viewers: number): ChatEvent {
	return {
		kind: "raid",
		text: `${raider} is raiding with ${plural(viewers, "viewer")}`,
	};
}

export function describeCheer(bits: number): ChatEvent {
	return {
		kind: "cheer",
		text: `cheered ${plural(bits, "bit")}`,
		cheermoteUrl: cheermoteUrl(bits),
	};
}

export function describeAnnouncement(): ChatEvent {
	return { kind: "announce", text: "Announcement" };
}

// isFirst and isReturningChatter are separate tags; first wins when both
// somehow arrive, since it is the rarer and more interesting one.
export function describeFirstChat(isReturning: boolean): ChatEvent {
	return {
		kind: "first",
		text: isReturning ? "Returning chatter" : "First message in this channel",
	};
}
