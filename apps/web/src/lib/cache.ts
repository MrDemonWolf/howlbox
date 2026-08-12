// Shared JSON fetch + localStorage cache for the third-party APIs
// (7TV/BTTV/FFZ emotes, ivr.fi badges). All are public, no auth,
// browser-CORS safe. Caching keeps OBS reloads from hammering them;
// an expired entry is served as a fallback when the refetch fails.

const CACHE_PREFIX = "hb-cache-v1:";
const FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_FAILURE_COOLDOWN_MS = 30_000;
const MAX_FAILURE_COOLDOWNS = 256;

// Named TTLs, shared by the emote and badge fetchers.
export const ONE_HOUR_MS = 60 * 60_000;
export const SIX_HOURS_MS = 6 * ONE_HOUR_MS;

export type JsonValidator<T> = (value: unknown) => value is T;

export interface JsonRequestOptions<T> {
	signal?: AbortSignal;
	validate?: JsonValidator<T>;
}

export interface CachedJsonOptions<T> extends JsonRequestOptions<T> {
	force?: boolean;
	// A failed provider should not be hammered by every later message while
	// it is down. Callers choose the scope: global provider, channel endpoint,
	// or per-user service.
	cooldownKey?: string;
	cooldownMs?: number;
}

// Cooldowns are intentionally in memory. A reload is a clean retry, while a
// live source avoids repeating a known-bad request in a tight message loop.
const failureCooldowns = new Map<string, number>();

function activeCooldownUntil(key: string): number {
	const until = failureCooldowns.get(key) ?? 0;
	if (until <= Date.now()) {
		failureCooldowns.delete(key);
		return 0;
	}
	return until;
}

function setFailureCooldown(key: string, until: number): void {
	const now = Date.now();
	for (const [storedKey, storedUntil] of failureCooldowns) {
		if (storedUntil <= now) {
			failureCooldowns.delete(storedKey);
		}
	}
	failureCooldowns.delete(key);
	failureCooldowns.set(key, until);
	while (failureCooldowns.size > MAX_FAILURE_COOLDOWNS) {
		const oldest = failureCooldowns.keys().next().value;
		if (oldest === undefined) {
			break;
		}
		failureCooldowns.delete(oldest);
	}
}

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

export async function getJson<T>(
	url: string,
	options: JsonRequestOptions<T> = {},
): Promise<T> {
	// abort a hung provider so the emote/badge promise never dangles
	const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
	const signal = options.signal
		? AbortSignal.any([options.signal, timeoutSignal])
		: timeoutSignal;
	const res = await fetch(url, {
		signal,
	});
	if (!res.ok) {
		throw new Error(`${url} -> ${res.status}`);
	}
	const value = (await res.json()) as unknown;
	if (options.validate && !options.validate(value)) {
		throw new Error(`${url} -> invalid JSON payload`);
	}
	return value as T;
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

function isAbortError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		(error as { name?: unknown }).name === "AbortError"
	);
}

// Returns the cached value while fresh, the refetched value on a miss,
// and the stale value if the refetch fails (null when nothing cached).
// force skips the freshness check (periodic ?refresh re-fetches) but
// keeps the cached value as the stale-if-error fallback.
export async function cachedJson<T>(
	key: string,
	ttlMs: number,
	url: string,
	options: boolean | CachedJsonOptions<T> = {},
): Promise<T | null> {
	const resolved =
		typeof options === "boolean"
			? ({ force: options } satisfies CachedJsonOptions<T>)
			: options;
	const storageKey = CACHE_PREFIX + key;
	let stale: T | null = null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			const parsed = JSON.parse(raw) as unknown;
			if (
				isCacheEntry<T>(parsed) &&
				(!resolved.validate || resolved.validate(parsed.v))
			) {
				if (!resolved.force && Date.now() - parsed.t < ttlMs) {
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
	const cooldownUntil = resolved.cooldownKey
		? activeCooldownUntil(resolved.cooldownKey)
		: 0;
	if (cooldownUntil > Date.now()) {
		return stale;
	}
	try {
		const value = await getJson<T>(url, resolved);
		writeCache(storageKey, value);
		if (resolved.cooldownKey) {
			failureCooldowns.delete(resolved.cooldownKey);
		}
		return value;
	} catch (error) {
		// Effect cleanup is expected, not a provider outage. Do not turn
		// navigation or Strict Mode cleanup into a retry cooldown.
		if (resolved.cooldownKey && !isAbortError(error)) {
			setFailureCooldown(
				resolved.cooldownKey,
				Date.now() + (resolved.cooldownMs ?? DEFAULT_FAILURE_COOLDOWN_MS),
			);
		}
		// stale-if-error beats a bundled snapshot for a client-only app
		return stale;
	}
}

// Tests need deterministic module-level cooldown state. Tree shaking removes
// this from the production bundle because no runtime module imports it.
export function resetCacheCooldownsForTests(): void {
	failureCooldowns.clear();
}

export function cacheCooldownSizeForTests(): number {
	return failureCooldowns.size;
}
