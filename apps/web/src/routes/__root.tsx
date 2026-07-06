import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";

import "../index.css";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	// static SEO + social tags live in index.html (crawlers do not run JS);
	// this only keeps the in-browser tab title/description in sync
	head: () => ({
		meta: [
			{
				title: "HowlBox - Self-hosted Twitch chat overlay for OBS",
			},
			{
				name: "description",
				content:
					"A themed Twitch chat overlay you host yourself. Thirteen themes, every emote, no login and no keys. The whole overlay is one URL.",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<Outlet />
		</>
	);
}
