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
		renderBadges: [],
		parts: [{ type: "text", text: "gg that was clutch" }],
		isAction: false,
		isPrivileged: true,
		// the wall is where the per-theme avatar shape is visible side by
		// side (circle on wolf, hard square on terminal and retro95)
		avatarUrl:
			"https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-70x70.png",
	},
	{
		id: "wall-2",
		timestamp: 0,
		channelId: null,
		login: "nova",
		displayName: "Nova",
		color: "#FF6AA2",
		badges: [],
		renderBadges: [],
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
			className="hb-card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-[color:var(--site-brand)]"
			search={{ theme }}
			to="/config"
		>
			<div className="relative flex min-h-[9rem] items-end overflow-hidden bg-[linear-gradient(135deg,#0b1017_0%,#141a28_100%)]">
				<HbRoot bg="bubble" className="w-full" theme={theme}>
					<MessageList
						animate={false}
						bg="bubble"
						fadeSeconds={0}
						messages={SAMPLE}
						showAvatars={true}
						showBadges={false}
						showPronouns={false}
						showTimestamps={false}
						theme={theme}
					/>
				</HbRoot>
			</div>
			<div className="hb-hairline flex items-center justify-between border-t px-4 py-3">
				<span className="font-semibold text-sm">{THEME_LABEL[theme]}</span>
				<code className="hb-text-2 font-mono text-xs transition-colors group-hover:text-[color:var(--site-brand-text)]">
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
