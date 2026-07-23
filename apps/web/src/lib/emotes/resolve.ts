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
