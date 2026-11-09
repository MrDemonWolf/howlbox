import { useCallback, useEffect, useMemo, useState } from "react";

import { OWNER_BADGE_URL } from "@/lib/emotes/resolve";
import type {
	AvatarMode,
	ChatEventKind,
	ChatMessageView,
} from "@/lib/twitch/types";

function emote(name: string, id: string) {
	return {
		type: "emote" as const,
		name,
		url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
	};
}

function text(value: string) {
	return { type: "text" as const, text: value };
}

// stable global-badge art (open CORS static CDN) so the "Show badges"
// toggle has something to render in previews
const MOD_BADGE =
	"https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2";
const BROADCASTER_BADGE =
	"https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2";

// Twitch's own generic default avatars. The demo chatters are invented,
// so these stand in rather than borrowing a real person's picture; the
// live overlay resolves real ones through lib/twitch/avatars.ts.
const DEFAULT_AVATARS = [
	"https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-70x70.png",
	"https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png",
	"https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-70x70.png",
	"https://static-cdn.jtvnw.net/user-default-pictures-uv/dbdc9198-def8-11e9-8681-784f43822e80-profile_image-70x70.png",
];

function avatarFor(login: string): string {
	// stable per login so a chatter keeps the same face across the loop
	let hash = 0;
	for (const char of login) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return DEFAULT_AVATARS[hash % DEFAULT_AVATARS.length];
}

type ScriptMessage = Omit<ChatMessageView, "id" | "timestamp">;

export const DEMO_SCRIPT: ScriptMessage[] = [
	{
		channelId: null,
		login: "moonhowler",
		displayName: "MoonHowler",
		color: "#00ACED",
		badges: [],
		renderBadges: [
			{ kind: "image", url: BROADCASTER_BADGE },
			{ kind: "text", text: "she/her" },
		],
		parts: [text("okay this overlay is clean")],
		isAction: false,
		isPrivileged: true,
		isSubscriber: true,
	},
	{
		channelId: null,
		login: "moonhowler",
		displayName: "MoonHowler",
		color: "#00ACED",
		badges: [],
		renderBadges: [
			{ kind: "image", url: BROADCASTER_BADGE },
			{ kind: "text", text: "she/her" },
		],
		parts: [text("wolf glass looks clean too")],
		isAction: false,
		isPrivileged: true,
		isSubscriber: true,
	},
	{
		channelId: null,
		login: "moonhowler",
		displayName: "MoonHowler",
		color: "#00ACED",
		badges: [],
		renderBadges: [
			{ kind: "image", url: BROADCASTER_BADGE },
			{ kind: "text", text: "she/her" },
		],
		parts: [text("the name colors are easy to pick out")],
		isAction: false,
		isPrivileged: true,
		isSubscriber: true,
	},
	{
		channelId: null,
		login: "lunathewolf",
		displayName: "LunaTheWolf",
		color: "#FF69B4",
		badges: [],
		renderBadges: [{ kind: "text", text: "they/them" }],
		parts: [text("no login?? no keys?? "), emote("Kappa", "25")],
		isAction: false,
		isPrivileged: false,
		isSubscriber: true,
	},
	{
		channelId: null,
		login: "mrdemonwolf",
		displayName: "MrDemonWolf",
		color: "#00ACED",
		badges: [],
		renderBadges: [{ kind: "image", url: OWNER_BADGE_URL }],
		parts: [text("checking in from the demo chat")],
		isAction: false,
		isPrivileged: true,
	},
	{
		channelId: null,
		login: "packleader_dan",
		displayName: "PackLeader_Dan",
		color: "#2E8B57",
		badges: [],
		renderBadges: [
			{ kind: "image", url: MOD_BADGE },
			{ kind: "text", text: "he/him" },
		],
		parts: [text("copy URL, paste in OBS, done")],
		isAction: false,
		isPrivileged: true,
	},
	// standalone event row: no author header, the line names everyone
	{
		channelId: null,
		login: "silverfang",
		displayName: "SilverFang",
		color: "#DAA520",
		badges: [],
		renderBadges: [],
		parts: [],
		isAction: false,
		isPrivileged: true,
		event: {
			kind: "sub",
			text: "SilverFang gifted 5 Tier 1 subs to the community",
		},
	},
	// standalone event that DOES carry a message, the shape a resub takes:
	// event line, separator, then the user's own text
	{
		channelId: null,
		login: "nightpaws",
		displayName: "NightPaws",
		color: "#8A2BE2",
		badges: [],
		renderBadges: [],
		parts: [text("6 months, still the comfiest stream")],
		isAction: false,
		isPrivileged: true,
		isSubscriber: true,
		event: {
			kind: "sub",
			text: "NightPaws resubscribed with Tier 1 for 6 months, 6 in a row",
		},
	},
	{
		channelId: null,
		login: "silverfang",
		displayName: "SilverFang",
		color: "#DAA520",
		badges: [],
		renderBadges: [],
		parts: [emote("DinoDance", "emotesv2_dcd06b30a5c24f6eb871e8f5edbd44f7")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "nightpaws",
		displayName: "NightPaws",
		color: "#8A2BE2",
		badges: [],
		renderBadges: [{ kind: "text", text: "she/they" }],
		parts: [text("31 themes is wild "), emote("LUL", "425618")],
		isAction: false,
		isPrivileged: false,
		isSubscriber: true,
	},
	{
		channelId: null,
		login: "aurorawolf",
		displayName: "AuroraWolf",
		color: "#FF4500",
		badges: [],
		renderBadges: [],
		parts: [text("howls at the overlay")],
		isAction: true,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "denmother",
		displayName: "DenMother",
		color: "#5F9EA0",
		badges: [],
		renderBadges: [{ kind: "image", url: MOD_BADGE }],
		parts: [text("timed out messages vanish instantly btw")],
		isAction: false,
		isPrivileged: true,
	},
	{
		channelId: null,
		login: "starsniffer",
		displayName: "StarSniffer",
		color: "#1E90FF",
		badges: [],
		renderBadges: [],
		parts: [text("morning stream "), emote("HeyGuys", "30259")],
		isAction: false,
		isPrivileged: false,
	},
	// nothing but emotes, so ?emotescale applies to this row and not to
	// the ones around it
	{
		channelId: null,
		login: "aurorawolf",
		displayName: "AuroraWolf",
		color: "#FF4500",
		badges: [],
		renderBadges: [],
		parts: [emote("LUL", "425618"), text(" "), emote("Kappa", "25")],
		isAction: false,
		isPrivileged: false,
	},
	// attached event row: keeps its author header and message body
	{
		channelId: null,
		login: "timbertail",
		displayName: "TimberTail",
		color: "#9ACD32",
		badges: [],
		renderBadges: [],
		parts: [text("keep it up")],
		isAction: false,
		isPrivileged: false,
		event: {
			kind: "cheer",
			text: "cheered 500 bits",
			cheermoteUrl: "https://static-cdn.jtvnw.net/bits/dark/animated/100/2.gif",
		},
	},
	{
		channelId: null,
		login: "timbertail",
		displayName: "TimberTail",
		color: "#9ACD32",
		badges: [],
		renderBadges: [],
		parts: [text("glass theme on gameplay looks unreal")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "ghostoftheden",
		displayName: "GhostOfTheDen",
		color: "#B22222",
		badges: [],
		renderBadges: [],
		parts: [text("self-hosted means it never breaks on you")],
		isAction: false,
		isPrivileged: false,
	},
];

// Apply the overlay's avatar and media settings to a demo row. The script
// carries animated art and an avatar on every chatter, so the settings
// that would have filtered those at fetch time are applied here instead.
// undefined avatarMode keeps every avatar (the landing demo's own toggle).
export function presentDemoMessage(
	message: ChatMessageView,
	avatarMode: AvatarMode | undefined,
	staticMedia: boolean,
): ChatMessageView {
	const avatarAllowed =
		avatarMode === undefined ||
		avatarMode === "all" ||
		(avatarMode === "subs" && message.isSubscriber);
	const withAvatar = avatarAllowed
		? message
		: { ...message, avatarUrl: undefined };
	if (!staticMedia) {
		return withAvatar;
	}
	const parts = withAvatar.parts.map((part) =>
		part.type === "emote"
			? {
					...part,
					url: part.url.replace("/default/dark/", "/static/dark/"),
				}
			: part,
	);
	const event = withAvatar.event?.cheermoteUrl
		? {
				...withAvatar.event,
				cheermoteUrl: withAvatar.event.cheermoteUrl
					.replace("/animated/", "/static/")
					.replace(/\.gif$/, ".png"),
			}
		: withAvatar.event;
	return { ...withAvatar, event, parts };
}

// canned message stream shared by the landing demo, the config preview
// and the overlay's ?demo mode. Not a real connection; timestamps use wall-clock so the
// optional timestamp column reads sensibly.
interface DemoStreamOptions {
	limit?: number;
	intervalMs?: number;
	// rows shown at once on start, capped at one pass of the script, so a
	// placement check sees a filled column without waiting for the interval
	initial?: number;
	events?: readonly ChatEventKind[];
	// When set, presentDemoMessage runs once per row at append time, so
	// rows keep their identity and stay memoized. The site previews leave
	// these unset and map instead, because their settings change live.
	avatarMode?: AvatarMode;
	staticMedia?: boolean;
}

interface DemoStream {
	messages: ChatMessageView[];
	removeMessage: (id: string) => void;
}

export function useDemoStream({
	limit = 8,
	intervalMs = 1700,
	initial = 4,
	events,
	avatarMode,
	staticMedia,
}: DemoStreamOptions = {}): DemoStream {
	const [messages, setMessages] = useState<ChatMessageView[]>([]);
	const scriptMessages = useMemo(
		() =>
			events
				? DEMO_SCRIPT.filter(
						(message) => !message.event || events.includes(message.event.kind),
					)
				: DEMO_SCRIPT,
		[events],
	);
	const removeMessage = useCallback((id: string) => {
		setMessages((current) => current.filter((message) => message.id !== id));
	}, []);

	useEffect(() => {
		let count = 0;
		// Start empty so an effect re-run (StrictMode, HMR, or a changed
		// event filter) cannot leave rows the current preview excludes.
		setMessages([]);
		const add = () => {
			const script = scriptMessages[count % scriptMessages.length];
			const id = `demo-${count}`;
			count++;
			if (!script) {
				return;
			}
			const message: ChatMessageView = {
				...script,
				id,
				timestamp: Date.now(),
				avatarUrl: avatarFor(script.login),
			};
			const shown =
				avatarMode === undefined && staticMedia === undefined
					? message
					: presentDemoMessage(message, avatarMode, staticMedia ?? false);
			setMessages((current) => [...current, shown].slice(-limit));
		};
		const burst = Math.min(initial, limit, scriptMessages.length);
		for (let index = 0; index < burst; index++) {
			add();
		}
		const timer = setInterval(add, intervalMs);
		return () => clearInterval(timer);
	}, [avatarMode, initial, intervalMs, limit, scriptMessages, staticMedia]);

	return { messages, removeMessage };
}
