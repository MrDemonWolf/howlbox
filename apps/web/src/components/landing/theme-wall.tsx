import { Link } from "@tanstack/react-router";

import { HbRoot } from "@/components/chat/hb-root";
import { MessageList } from "@/components/chat/message-list";
import { THEMES, type Theme } from "@/lib/overlay/params";
import { THEME_LABEL } from "@/lib/overlay/theme-meta";
import type { ChatMessageView } from "@/lib/twitch/types";

import "@/components/chat/overlay.css";

// two short, static messages rendered in each theme's real surface, so
// the gallery shows the actual product instead of a gradient swatch
const SAMPLE: ChatMessageView[] = [
	{
		id: "wall-1",
		timestamp: 0,
		channelId: null,
		login: "wolfpup",
		displayName: "WolfPup",
		color: "#00ACED",
		badges: [],
		badgeUrls: [],
		parts: [{ type: "text", text: "gg that was clutch" }],
		isAction: false,
		isPrivileged: true,
	},
	{
		id: "wall-2",
		timestamp: 0,
		channelId: null,
		login: "nova",
		displayName: "Nova",
		color: "#FF6AA2",
		badges: [],
		badgeUrls: [],
		parts: [
			{ type: "text", text: "welcome in " },
			{
				type: "emote",
				name: "Kappa",
				url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
			},
		],
		isAction: false,
		isPrivileged: false,
	},
];

function ThemeTile({ theme }: { theme: Theme }) {
	return (
		<Link
			className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-1 hover:border-[#00ACED]/45 hover:shadow-[0_12px_40px_rgb(0_20_44/0.5)]"
			to="/config"
		>
			<div className="relative flex min-h-[9rem] items-end overflow-hidden bg-[linear-gradient(135deg,#0b1017_0%,#141a28_100%)]">
				<HbRoot bg="bubble" className="w-full" theme={theme}>
					<MessageList
						animate={false}
						bg="bubble"
						fadeSeconds={0}
						messages={SAMPLE}
						showBadges={false}
						showTimestamps={false}
						theme={theme}
					/>
				</HbRoot>
			</div>
			<div className="flex items-center justify-between border-white/5 border-t px-4 py-3">
				<span className="font-semibold text-sm">{THEME_LABEL[theme]}</span>
				<code className="font-mono text-white/35 text-xs transition-colors group-hover:text-[#7fd7ff]">
					?theme={theme}
				</code>
			</div>
		</Link>
	);
}

export function ThemeWall() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{THEMES.map((theme) => (
				<ThemeTile key={theme} theme={theme} />
			))}
		</div>
	);
}
