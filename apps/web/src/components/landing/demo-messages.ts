import { useEffect, useState } from "react";

import type { ChatMessageView } from "@/lib/twitch/types";

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

type ScriptMessage = Omit<ChatMessageView, "id" | "timestamp">;

export const DEMO_SCRIPT: ScriptMessage[] = [
	{
		channelId: null,
		login: "moonhowler",
		displayName: "MoonHowler",
		color: "#00ACED",
		badges: [],
		badgeUrls: [BROADCASTER_BADGE],
		parts: [text("okay this overlay is clean")],
		isAction: false,
		isPrivileged: true,
	},
	{
		channelId: null,
		login: "lunathewolf",
		displayName: "LunaTheWolf",
		color: "#FF69B4",
		badges: [],
		badgeUrls: [],
		parts: [text("no login?? no keys?? "), emote("Kappa", "25")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "packleader_dan",
		displayName: "PackLeader_Dan",
		color: "#2E8B57",
		badges: [],
		badgeUrls: [MOD_BADGE],
		parts: [text("copy URL, paste in OBS, done")],
		isAction: false,
		isPrivileged: true,
	},
	{
		channelId: null,
		login: "silverfang",
		displayName: "SilverFang",
		color: "#DAA520",
		badges: [],
		badgeUrls: [],
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
		badgeUrls: [],
		parts: [text("15 themes is wild "), emote("LUL", "425618")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "aurorawolf",
		displayName: "AuroraWolf",
		color: "#FF4500",
		badges: [],
		badgeUrls: [],
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
		badgeUrls: [MOD_BADGE],
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
		badgeUrls: [],
		parts: [text("morning stream "), emote("HeyGuys", "30259")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "timbertail",
		displayName: "TimberTail",
		color: "#9ACD32",
		badges: [],
		badgeUrls: [],
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
		badgeUrls: [],
		parts: [text("self-hosted means it never breaks on you")],
		isAction: false,
		isPrivileged: false,
	},
];

// canned message stream shared by the landing demo and the config
// preview. Not a real connection; timestamps use wall-clock so the
// optional timestamp column reads sensibly.
export function useDemoStream(limit = 8, intervalMs = 1700): ChatMessageView[] {
	const [messages, setMessages] = useState<ChatMessageView[]>([]);

	useEffect(() => {
		let count = 0;
		const add = () => {
			const script = DEMO_SCRIPT[count % DEMO_SCRIPT.length];
			const id = `demo-${count}`;
			count++;
			if (!script) {
				return;
			}
			setMessages((prev) =>
				[...prev, { ...script, id, timestamp: Date.now() }].slice(-limit),
			);
		};
		for (let i = 0; i < Math.min(4, limit); i++) {
			add();
		}
		const timer = setInterval(add, intervalMs);
		return () => clearInterval(timer);
	}, [limit, intervalMs]);

	return messages;
}
