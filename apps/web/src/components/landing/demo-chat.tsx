import { useEffect, useState } from "react";

import { ChatMessageRow } from "@/components/chat/chat-message";
import { LIGHT_SURFACE_THEMES } from "@/components/chat/chat-overlay";
import { THEMES } from "@/lib/overlay/params";
import type { ChatMessageView } from "@/lib/twitch/types";

import "@/components/chat/overlay.css";

type Theme = (typeof THEMES)[number];

function emote(name: string, id: string) {
	return {
		type: "emote" as const,
		name,
		id,
		url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
	};
}

function text(value: string) {
	return { type: "text" as const, text: value };
}

const SCRIPT: Omit<ChatMessageView, "id" | "timestamp">[] = [
	{
		channelId: null,
		login: "moonhowler",
		displayName: "MoonHowler",
		color: "#00ACED",
		badges: [],
		parts: [text("okay this overlay is clean")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "lunathewolf",
		displayName: "LunaTheWolf",
		color: "#FF69B4",
		badges: [],
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
		parts: [text("13 themes is wild "), emote("LUL", "425618")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "aurorawolf",
		displayName: "AuroraWolf",
		color: "#FF4500",
		badges: [],
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
		parts: [text("HeyGuys "), emote("HeyGuys", "30259")],
		isAction: false,
		isPrivileged: false,
	},
	{
		channelId: null,
		login: "timbertail",
		displayName: "TimberTail",
		color: "#9ACD32",
		badges: [],
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
		parts: [text("self-hosted means it never breaks on you")],
		isAction: false,
		isPrivileged: false,
	},
];

export function DemoChat() {
	const [theme, setTheme] = useState<Theme>("wolf");
	const [messages, setMessages] = useState<ChatMessageView[]>([]);

	useEffect(() => {
		let count = 0;
		const add = () => {
			const script = SCRIPT[count % SCRIPT.length];
			const id = `demo-${count}`;
			const timestamp = count;
			count++;
			if (script) {
				setMessages((prev) =>
					[...prev, { ...script, id, timestamp }].slice(-7),
				);
			}
		};
		for (let i = 0; i < 4; i++) {
			add();
		}
		const timer = setInterval(add, 1700);
		return () => clearInterval(timer);
	}, []);

	const surfaceTone = LIGHT_SURFACE_THEMES.has(theme) ? "light" : "dark";

	return (
		<div className="flex flex-col gap-3">
			<div className="relative h-105 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
				{/* gameplay stand-in behind the transparent overlay */}
				<div className="absolute inset-0 bg-[linear-gradient(135deg,#1b2735_0%,#2d4a3e_38%,#6b4f2e_72%,#3d2b4f_100%)]" />
				<div
					className="hb-root absolute inset-0 flex flex-col justify-end gap-1.5 overflow-hidden p-3 text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:var(--hb-font-size)]"
					data-bg="bubble"
					data-theme={theme}
				>
					{messages.map((message) => (
						<div className="hb-demo-in" key={message.id}>
							<ChatMessageRow
								bg="bubble"
								message={message}
								surfaceTone={surfaceTone}
							/>
						</div>
					))}
				</div>
			</div>
			<div className="flex flex-wrap justify-center gap-1.5">
				{THEMES.map((t) => (
					<button
						className={`rounded-full border px-3 py-1 font-medium text-xs transition-colors ${
							t === theme
								? "border-[#00ACED] bg-[#00ACED]/15 text-[#7fd7ff]"
								: "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
						}`}
						key={t}
						onClick={() => setTheme(t)}
						type="button"
					>
						{t}
					</button>
				))}
			</div>
		</div>
	);
}
