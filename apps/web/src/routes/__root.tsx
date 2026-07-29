import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

import { RootErrorFallback } from "@/components/error-fallbacks";

import "../index.css";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	// last-resort boundary: any route that throws while rendering (or whose
	// lazy chunk fails to load) lands here instead of a blank page
	errorComponent: RootErrorFallback,
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
					"A themed Twitch chat overlay you host yourself. Fifteen themes, every emote, no login and no keys. The whole overlay is one URL.",
			},
		],
	}),
});

function RootComponent() {
	// next-themes was already a dependency (sonner reads useTheme); it owns
	// the light/dark class on <html> and its persistence. main.tsx paints
	// the same class synchronously so the first frame is not the wrong mode.
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<HeadContent />
			<Outlet />
		</ThemeProvider>
	);
}
