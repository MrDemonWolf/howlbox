// Shared media preferences for provider image selection. OBS 31 uses DPR 1,
// so 1x is the efficient default; callers can request a larger source when
// the overlay's CSS size actually needs it.
export const ASSET_SCALES = [1, 2, 3] as const;

export type AssetScale = (typeof ASSET_SCALES)[number];

export interface MediaPreferences {
	assetScale?: AssetScale;
	staticMedia?: boolean;
}

export interface MediaFetchOptions extends MediaPreferences {
	// Periodic refresh bypasses only channel-scoped TTLs. Global provider
	// payloads keep their longer cache lifetime.
	forceChannel?: boolean;
	signal?: AbortSignal;
}

export interface ResolvedMediaPreferences {
	assetScale: AssetScale;
	staticMedia: boolean;
}

export function resolveMediaPreferences(
	options: MediaPreferences = {},
): ResolvedMediaPreferences {
	return {
		assetScale: options.assetScale ?? 1,
		staticMedia: options.staticMedia ?? false,
	};
}

export function isAssetScale(value: unknown): value is AssetScale {
	return ASSET_SCALES.some((scale) => scale === value);
}
