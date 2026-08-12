import type {
	ChatMessageView,
	MessagePart,
	RenderBadge,
} from "@/lib/twitch/types";

import type { EmoteMap } from "./emotes";

export type BadgeMap = Map<string, string>;

export type EmotePart = Extract<MessagePart, { type: "emote" }>;

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
	let seen = hasCheermote;
	for (const part of parts) {
		if (part.type === "emote") {
			seen = true;
		} else if (part.text.trim() !== "") {
			return false;
		}
	}
	return seen;
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

// applied at append time (not render) so rows stay memoizable
export function resolveMessageExtras(
	view: ChatMessageView,
	emotes: EmoteMap | null,
	badges: BadgeMap | null,
	pronoun: string | null,
	avatarUrl: string | null,
): ChatMessageView {
	const parts =
		emotes && emotes.size > 0
			? view.parts.flatMap((part) =>
					part.type === "text" ? splitTextPart(part.text, emotes) : [part],
				)
			: view.parts;
	const renderBadges: RenderBadge[] = [];
	if (badges) {
		for (const badge of view.badges) {
			// bare set key = custom art covering every version
			const url =
				badges.get(`${badge.set}/${badge.version}`) ?? badges.get(badge.set);
			if (url) {
				renderBadges.push({ kind: "image", url });
			}
		}
	}
	// pronoun rides last, after the native badges (7TV/FFZ convention)
	if (pronoun) {
		renderBadges.push({ kind: "text", text: pronoun });
	}
	return { ...view, parts, renderBadges, avatarUrl: avatarUrl ?? undefined };
}
