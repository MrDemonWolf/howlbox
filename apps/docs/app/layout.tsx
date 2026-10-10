import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Provider } from "@/components/provider";
import { SITE_URL } from "@/lib/site";

import "./global.css";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "HowlBox Docs",
		template: "%s | HowlBox",
	},
	description:
		"Set up the HowlBox Twitch chat overlay, build its URL, choose from 31 themes, and customize badges and CSS for OBS.",
	applicationName: "HowlBox",
	authors: [{ name: "MrDemonWolf, Inc." }],
	creator: "MrDemonWolf, Inc.",
	openGraph: {
		type: "website",
		siteName: "HowlBox",
		url: `${SITE_URL}/docs/`,
		title: "HowlBox Docs",
		description:
			"Set up the HowlBox Twitch chat overlay, build its URL, choose from 31 themes, and customize badges and CSS for OBS.",
	},
	twitter: {
		card: "summary_large_image",
		title: "HowlBox Docs",
		description:
			"Set up the HowlBox Twitch chat overlay, build its URL, choose from 31 themes, and customize badges and CSS for OBS.",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
