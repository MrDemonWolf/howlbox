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

// A parsed entry is trusted only after a shape check: any localStorage
// key (or a truncated write) can hold JSON that is valid but not ours.
function isCacheEntry<T>(value: unknown): value is CacheEntry<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { t?: unknown }).t === "number" &&
		"v" in value
	);
}

// localStorage can throw on the access itself, not just on write: a
// sandboxed OBS browser source or a private-mode tab makes every method
// raise SecurityError. Every touch goes through these so an unavailable
// store degrades to "no persistence" instead of throwing out of a fetch.
function safeRemove(key: string) {
	try {
		localStorage.removeItem(key);
	} catch {
		// storage unavailable: nothing to clean up
	}
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
	// The whole scan is guarded: this runs from writeCache's failure path,
	// so localStorage is already misbehaving; it must never throw a second
	// time and take the caller down with it.
	try {
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
	} catch {
		// storage unavailable mid-scan: give up, the fresh value is still
		// returned to the caller
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
// force skips the freshness check (periodic ?refresh re-fetches) but
// keeps the cached value as the stale-if-error fallback.
export async function cachedJson<T>(
	key: string,
	ttlMs: number,
	url: string,
	force = false,
): Promise<T | null> {
	const storageKey = CACHE_PREFIX + key;
	let stale: T | null = null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const parsed = JSON.parse(raw) as unknown;
			if (isCacheEntry<T>(parsed)) {
				if (!force && Date.now() - parsed.t < ttlMs) {
					return parsed.v;
				}
				stale = parsed.v;
			} else {
				// valid JSON but not our shape: treat as a miss and clear it
				safeRemove(storageKey);
			}
		}
	} catch {
		// corrupt entry or unavailable storage: remove through the guarded
		// helper so a throwing store still reaches the refetch below
		safeRemove(storageKey);
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
