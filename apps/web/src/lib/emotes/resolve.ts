import type { ChatMessageView, MessagePart } from "@/lib/twitch/types";

import type { EmoteMap } from "./emotes";

export type BadgeMap = Map<string, string>;

function splitTextPart(text: string, emotes: EmoteMap): MessagePart[] {
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
				id: token,
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
): ChatMessageView {
	const parts =
		emotes && emotes.size > 0
			? view.parts.flatMap((part) =>
					part.type === "text" ? splitTextPart(part.text, emotes) : [part],
				)
			: view.parts;
	const badgeUrls = badges
		? view.badges
				.map((badge) => badges.get(`${badge.set}/${badge.version}`))
				.filter((url): url is string => Boolean(url))
		: [];
	return { ...view, parts, badgeUrls };
}
