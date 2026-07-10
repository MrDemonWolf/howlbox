// Shared JSON fetch + localStorage cache for the third-party APIs
// (7TV/BTTV/FFZ emotes, ivr.fi badges). All are public, no auth,
// browser-CORS safe. Caching keeps OBS reloads from hammering them;
// an expired entry is served as a fallback when the refetch fails.

const CACHE_PREFIX = "hb-cache-v1:";

export async function getJson(url: string): Promise<unknown> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`${url} -> ${res.status}`);
	}
	return res.json();
}

// Returns the cached value while fresh, the refetched value on a miss,
// and the stale value if the refetch fails (null when nothing cached).
export async function cachedJson(
	key: string,
	ttlMs: number,
	url: string,
): Promise<unknown> {
	const storageKey = CACHE_PREFIX + key;
	let stale: unknown = null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const entry = JSON.parse(raw) as { t: number; v: unknown };
			if (Date.now() - entry.t < ttlMs) {
				return entry.v;
			}
			stale = entry.v;
		}
	} catch {
		// ignore bad cache entries
	}
	try {
		const value = await getJson(url);
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ t: Date.now(), v: value }),
			);
		} catch {
			// storage full: still return the fresh value
		}
		return value;
	} catch {
		// stale-if-error beats a bundled snapshot for a client-only app
		return stale;
	}
}
