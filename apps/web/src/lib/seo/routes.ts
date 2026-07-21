// Single source of truth for per-route head metadata.
//
// Crawlers do not run JS and social unfurlers never do, so the title,
// description, canonical and Open Graph tags have to exist in the HTML
// that the server hands over. The build emits one real index.html per
// route from this list (see the seo plugin in vite.config.ts), which is
// also what stops GitHub Pages serving every route through 404.html
// with an HTTP 404 status.
//
// Canonical form is WITH a trailing slash, because that is what GitHub
// Pages 301-redirects to for a directory. TanStack Router matches
// "/docs/" to the "/docs" route, so nothing else has to change.

export const SITE_ORIGIN = "https://mrdemonwolf.github.io";

// Kept in step with BASE_PATH in .github/workflows/deploy.yml. Moving to
// a custom domain means changing this and dropping BASE_PATH together.
export const SITE_BASE = "/howlbox/";

export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE}`;
export const OG_IMAGE_ALT = "HowlBox, a Twitch chat overlay for OBS";

export interface SeoRoute {
	/** path segment, "" for the home page. No leading or trailing slash. */
	path: string;
	title: string;
	description: string;
	/** file name under public/, used for og:image */
	ogImage: string;
	/** false emits robots noindex and keeps the route out of the sitemap */
	index: boolean;
}

// Titles stay near 60 characters so they survive SERP truncation, and
// lead with the words that carry information rather than the brand.
export const SEO_ROUTES: SeoRoute[] = [
	{
		path: "",
		title: "HowlBox: Twitch chat overlay for OBS, no account",
		description:
			"A self-hosted Twitch chat overlay for OBS browser sources. Fifteen themes, 7TV, BTTV and FFZ emotes, and the whole configuration rides in the URL. No login, no API keys, no server.",
		ogImage: "og.png",
		index: true,
	},
	{
		path: "docs",
		title: "Overlay URL parameters and CSS hooks - HowlBox",
		description:
			"Every HowlBox URL parameter with its own anchor, both custom badge art formats, the hb-* class contract for the OBS Custom CSS field, troubleshooting, and what anonymous chat cannot do.",
		ogImage: "og-docs.png",
		index: true,
	},
	{
		path: "config",
		title: "Build your overlay URL - HowlBox",
		description:
			"Pick a theme and a display mode, watch the real overlay render over an OBS transparency checker, and copy the URL. Paste an existing overlay URL to load its settings back in.",
		ogImage: "og-config.png",
		index: true,
	},
	{
		path: "privacy",
		title: "Privacy policy - HowlBox",
		description:
			"HowlBox stores nothing and runs no server. What the browser fetches, what stays in local storage, and which third-party services a running overlay talks to.",
		ogImage: "og.png",
		index: true,
	},
	{
		path: "terms",
		title: "Terms of service - HowlBox",
		description:
			"Terms for using HowlBox, an independent open-source Twitch chat overlay published by MrDemonWolf, Inc.",
		ogImage: "og.png",
		index: true,
	},
	{
		// The OBS browser source itself. Nothing to index, and a search
		// result for it would be a blank page to a human.
		path: "overlay",
		title: "HowlBox overlay",
		description: "The OBS browser source view.",
		ogImage: "og.png",
		index: false,
	},
];

/** Absolute canonical URL for a route, trailing slash included. */
export function canonicalFor(path: string) {
	return path ? `${SITE_URL}${path}/` : SITE_URL;
}

/**
 * Structured data. WebApplication is a subtype of SoftwareApplication,
 * so Google parses the same properties, and it is the accurate type for
 * something that runs in a browser source rather than being installed.
 *
 * No aggregateRating on purpose: Google requires a rating or review for
 * the Software App rich result, there is no honest rating data for this,
 * and inventing one is the self-serving-review pattern that earns a
 * manual action. The markup is still worth shipping as machine-readable
 * product metadata.
 */
export const STRUCTURED_DATA = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "HowlBox",
	url: SITE_URL,
	description:
		"A free, self-hosted, client-only Twitch chat overlay for OBS browser sources. Fifteen themes, 7TV, BTTV and FrankerFaceZ emotes, no login and no API keys.",
	applicationCategory: "MultimediaApplication",
	operatingSystem: "Any web browser, or an OBS browser source",
	browserRequirements: "Chromium 127 or newer, which ships with OBS 31",
	isAccessibleForFree: true,
	license: "https://github.com/MrDemonWolf/howlbox/blob/main/LICENSE",
	offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
	author: {
		"@type": "Organization",
		name: "MrDemonWolf, Inc.",
		url: "https://www.mrdemonwolf.com",
	},
};
