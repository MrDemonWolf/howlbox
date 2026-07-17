// Shared JSON fetch + localStorage cache for the third-party APIs
// (7TV/BTTV/FFZ emotes, ivr.fi badges). All are public, no auth,
// browser-CORS safe. Caching keeps OBS reloads from hammering them;
// an expired entry is served as a fallback when the refetch fails.

const CACHE_PREFIX = "hb-cache-v1:";
const FETCH_TIMEOUT_MS = 10_000;

// Named TTLs, shared by the emote and badge fetchers.
export const ONE_HOUR_MS = 60 * 60_000;
export const SIX_HOURS_MS = 6 * ONE_HOUR_MS;

interface CacheEntry<T> {
	t: number;
	v: T;
}

export async function getJson<T>(url: string): Promise<T> {
	// abort a hung provider so the emote/badge promise never dangles
	const res = await fetch(url, {
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});
	if (!res.ok) {
		throw new Error(`${url} -> ${res.status}`);
	}
	return res.json() as Promise<T>;
}

// Quota is hit: drop the oldest hb-cache entries to make room. A heavy
// channel-switcher accretes one permanent key per channel, so without
// this the cache wedges once storage fills.
// ponytail: age-sorted bulk evict, swap for a real LRU only if this
// proves too blunt.
function evictOldest() {
	const entries: { key: string; t: number }[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key?.startsWith(CACHE_PREFIX)) {
			continue;
		}
		let t = 0;
		try {
			t =
				(JSON.parse(localStorage.getItem(key) ?? "{}") as { t?: number }).t ??
				0;
		} catch {
			// unparseable entry sorts oldest and gets evicted first
		}
		entries.push({ key, t });
	}
	entries.sort((a, b) => a.t - b.t);
	for (const { key } of entries.slice(0, Math.ceil(entries.length / 2))) {
		localStorage.removeItem(key);
	}
}

function writeCache<T>(storageKey: string, value: T) {
	const raw = JSON.stringify({
		t: Date.now(),
		v: value,
	} satisfies CacheEntry<T>);
	try {
		localStorage.setItem(storageKey, raw);
	} catch {
		// out of room: evict and retry once, then leave it (the fresh
		// value is returned regardless)
		try {
			evictOldest();
			localStorage.setItem(storageKey, raw);
		} catch {
			// still full: nothing else to do
		}
	}
}

// Returns the cached value while fresh, the refetched value on a miss,
// and the stale value if the refetch fails (null when nothing cached).
export async function cachedJson<T>(
	key: string,
	ttlMs: number,
	url: string,
): Promise<T | null> {
	const storageKey = CACHE_PREFIX + key;
	let stale: T | null = null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const entry = JSON.parse(raw) as CacheEntry<T>;
			if (Date.now() - entry.t < ttlMs) {
				return entry.v;
			}
			stale = entry.v;
		}
	} catch {
		// corrupt entry: remove it so it stops re-throwing on every load
		localStorage.removeItem(storageKey);
	}
	try {
		const value = await getJson<T>(url);
		writeCache(storageKey, value);
		return value;
	} catch {
		// stale-if-error beats a bundled snapshot for a client-only app
		return stale;
	}
}
