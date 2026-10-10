import type {
	ChatMessageView,
	MessagePart,
	RenderBadge,
} from "@/lib/twitch/types";

import type { EmoteMap } from "./emotes";

export type BadgeMap = Map<string, string>;

export const OWNER_LOGIN = "mrdemonwolf";
export const OWNER_BADGE_URL =
	"https://www.mrdemonwolf.com/wp-content/uploads/2022/12/logo.svg";

export type EmotePart = Extract<MessagePart, { type: "emote" }>;

export function emoteMapsEqual(a: EmoteMap, b: EmoteMap): boolean {
	if (a.size !== b.size) {
		return false;
	}
	for (const [name, emote] of a) {
		const other = b.get(name);
		if (
			!other ||
			other.url !== emote.url ||
			other.zeroWidth !== emote.zeroWidth
		) {
			return false;
		}
	}
	return true;
}

export function badgeMapsEqual(a: BadgeMap, b: BadgeMap): boolean {
	if (a.size !== b.size) {
		return false;
	}
	for (const [key, url] of a) {
		if (!b.has(key) || b.get(key) !== url) {
			return false;
		}
	}
	return true;
}

export interface RenderGroup {
	part: MessagePart;
	// 7TV zero-width emotes stack over the preceding emote
	overlays: EmotePart[];
}

// Group a rendered part list so each 7TV zero-width overlay emote stacks
// onto the emote before it instead of taking its own slot. A leading
// zero-width emote with no preceding emote falls through to a normal
// standalone render. Pure so it can be unit-tested apart from the row.
export function groupParts(parts: MessagePart[]): RenderGroup[] {
	const groups: RenderGroup[] = [];
	for (const part of parts) {
		if (part.type === "emote" && part.zeroWidth) {
			const last = groups.at(-1);
			if (last?.part.type === "emote") {
				last.overlays.push(part);
				continue;
			}
			// Chat emote tokens are separated by whitespace. Consume that
			// separator when a zero-width emote follows a rendered emote, so the
			// overlay stacks instead of becoming its own image slot.
			if (
				last?.part.type === "text" &&
				/^\s+$/.test(last.part.text) &&
				groups.at(-2)?.part.type === "emote"
			) {
				groups.pop();
				groups.at(-1)?.overlays.push(part);
				continue;
			}
		}
		groups.push({ part, overlays: [] });
	}
	return groups;
}

// True when the message body is nothing but art: at least one emote, and
// every other part whitespace. That is the case the ?emotescale jumbo
// applies to, so one word alongside the emote keeps the row normal.
//
// hasCheermote counts as art of its own. A cheer's "CheerN" tokens are
// stripped from the body (see stripCheermoteTokens), so a message that
// was only bits arrives here with no parts at all while still rendering
// the tier image. Without this it would be the one all-art body that
// does not grow, even though "Cheer100 PogChamp" does.
export function isEmoteOnly(
	parts: MessagePart[],
	hasCheermote = false,
): boolean {
	return emoteOnlyCount(parts, hasCheermote) > 0;
}

// How many pieces of art an emote-only row holds, or 0 when the row is not
// emote-only. The count is what decides how far ?emotescale actually grows
// them: see the decay in chat-message.tsx.
export function emoteOnlyCount(
	parts: MessagePart[],
	hasCheermote = false,
): number {
	let count = hasCheermote ? 1 : 0;
	for (const part of parts) {
		if (part.type === "emote") {
			count++;
		} else if (part.text.trim() !== "") {
			return 0;
		}
	}
	return count;
}

export function splitTextPart(text: string, emotes: EmoteMap): MessagePart[] {
	const out: MessagePart[] = [];
	let pendingText = "";
	// split on whitespace, keeping the separators so spacing survives
	for (const token of text.split(/(\s+)/)) {
		const emote = emotes.get(token);
		if (emote) {
			if (pendingText) {
				out.push({ type: "text", text: pendingText });
				pendingText = "";
			}
			out.push({
				type: "emote",
				name: token,
				url: emote.url,
				zeroWidth: emote.zeroWidth,
				thirdParty: true,
			});
		} else {
			pendingText += token;
		}
	}
	if (pendingText) {
		out.push({ type: "text", text: pendingText });
	}
	return out;
}

function sameParts(a: MessagePart[], b: MessagePart[]): boolean {
	return (
		a.length === b.length &&
		a.every((part, index) => {
			const other = b[index];
			if (!other || part.type !== other.type) {
				return false;
			}
			if (part.type === "text") {
				return other.type === "text" && part.text === other.text;
			}
			return (
				other.type === "emote" &&
				part.name === other.name &&
				part.url === other.url &&
				part.zeroWidth === other.zeroWidth &&
				part.thirdParty === other.thirdParty
			);
		})
	);
}

function sameBadges(a: RenderBadge[], b: RenderBadge[]): boolean {
	return (
		a.length === b.length &&
		a.every((badge, index) => {
			const other = b[index];
			return (
				other !== undefined &&
				badge.kind === other.kind &&
				(badge.kind === "image"
					? other.kind === "image" && badge.url === other.url
					: other.kind === "text" && badge.text === other.text)
			);
		})
	);
}

// applied at append time (not render) so rows stay memoizable
export function resolveMessageExtras(
	view: ChatMessageView,
	emotes: EmoteMap | null,
	badges: BadgeMap | null,
	pronoun: string | null,
	avatarUrl: string | null,
): ChatMessageView {
	const resolvedParts = emotes
		? view.parts.flatMap((part): MessagePart[] => {
				if (part.type === "text") {
					return splitTextPart(part.text, emotes);
				}
				if (!part.thirdParty) {
					return [part];
				}
				const emote = emotes.get(part.name);
				return emote
					? [{ ...part, url: emote.url, zeroWidth: emote.zeroWidth }]
					: [{ type: "text", text: part.name }];
			})
		: view.parts;
	const resolvedBadges: RenderBadge[] = [];
	if (badges) {
		for (const badge of view.badges) {
			// bare set key = custom art covering every version
			const url =
				badges.get(`${badge.set}/${badge.version}`) ?? badges.get(badge.set);
			if (url) {
				resolvedBadges.push({ kind: "image", url });
			}
		}
	}
	if (view.login === OWNER_LOGIN) {
		resolvedBadges.push({ kind: "image", url: OWNER_BADGE_URL });
	}
	// pronoun rides last, after the native badges (7TV/FFZ convention)
	if (pronoun) {
		resolvedBadges.push({ kind: "text", text: pronoun });
	}
	const parts = sameParts(view.parts, resolvedParts)
		? view.parts
		: resolvedParts;
	const renderBadges = sameBadges(view.renderBadges, resolvedBadges)
		? view.renderBadges
		: resolvedBadges;
	const resolvedAvatarUrl = avatarUrl ?? undefined;
	if (
		parts === view.parts &&
		renderBadges === view.renderBadges &&
		resolvedAvatarUrl === view.avatarUrl
	) {
		return view;
	}
	return { ...view, parts, renderBadges, avatarUrl: resolvedAvatarUrl };
}

export function resolveMessageMedia(
	view: ChatMessageView,
	emotes: EmoteMap | null,
	badges: BadgeMap | null,
): ChatMessageView {
	const pronoun = view.renderBadges.find((badge) => badge.kind === "text");
	return resolveMessageExtras(
		view,
		emotes,
		badges,
		pronoun?.kind === "text" ? pronoun.text : null,
		view.avatarUrl ?? null,
	);
}
