// Which CDN variant each provider is asked for. Every emote URL in the
// overlay used to be pinned to the 2x asset (roughly 56px), which is
// sharp for the stock 1.6em render box and stays sharp up to 2x. Past
// that it visibly softens, so ?size and ?emotescale together decide
// between the pinned 2x set and the largest variant each provider
// actually publishes.
//
// Two buckets, not a per-provider ladder: 7TV's 4x is several times the
// bytes of its 2x, and a busy channel loads hundreds of emotes. Spending
// that on detail nobody can see is worse than a slightly soft edge.
//
// The maxima are what the CDNs actually serve, not what the docs imply:
// BTTV 404s on 4x.webp, Twitch's 4.0 returns the 3.0 payload, and the
// FFZ v1 API emits multiplier keys 1, 2 and 4 with no 3.

export type AssetTier = "standard" | "high";

export interface TierVariants {
	// 7TV path suffix after /emote/{id}/
	sevenTv: string;
	// BTTV path suffix after /emote/{id}/
	bttv: string;
	// FFZ urls{} / animated{} multiplier key
	ffz: "1" | "2" | "4";
	// twurple buildEmoteImageUrl size
	twitch: "1.0" | "2.0" | "3.0";
	// /bits/{theme}/animated/{tier}/{scale}.gif
	cheer: string;
}

const VARIANTS: Record<AssetTier, TierVariants> = {
	// byte for byte what the overlay requested before ?emotescale existed
	standard: {
		sevenTv: "2x.webp",
		bttv: "2x.webp",
		ffz: "2",
		twitch: "2.0",
		cheer: "2",
	},
	high: {
		sevenTv: "4x.webp",
		bttv: "3x.webp",
		ffz: "4",
		twitch: "3.0",
		cheer: "4",
	},
};

export function tierVariants(tier: AssetTier): TierVariants {
	return VARIANTS[tier];
}

// ?size is a percentage of the theme's font size and the emote box is
// sized in em, so ?size already scales emotes on its own. The drawn size
// is the product of the two, which is the only number the asset choice
// can honestly key off.
export function effectiveEmoteScale(sizePercent = 100, emoteScale = 1): number {
	return (sizePercent / 100) * emoteScale;
}

// Strictly greater than 2: ?size=200 on its own lands exactly on the 2x
// asset's native size, where it is still pixel-exact, so that overlay
// must not start paying for the bigger download.
export function assetTier(sizePercent = 100, emoteScale = 1): AssetTier {
	return effectiveEmoteScale(sizePercent, emoteScale) > 2 ? "high" : "standard";
}
