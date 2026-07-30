// Profile pictures via api.ivr.fi, the same tokenless open-CORS service
// used for Twitch badge art. Lookups are lazy, batched and bounded so a
// long-running busy source cannot grow memory or network work forever.

import { getJson } from "@/lib/cache";

const USER_API = "https://api.ivr.fi/v2/twitch/user";
const BATCH_WINDOW_MS = 300;
const BATCH_MAX = 50;
const MAX_CACHE_ENTRIES = 2_000;
const MAX_PENDING_LOGINS = 1_000;
const MAX_CONCURRENT_REQUESTS = 2;
const FAILURE_COOLDOWN_MS = 30_000;

// login -> avatar URL, or "" for a valid lookup with no picture.
const cache = new Map<string, string>();
const pending = new Set<string>();
let queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let activeRequests = 0;
let failureCooldownUntil = 0;

interface IvrUser {
	login?: string;
	logo?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLogin(value: unknown): value is string {
	return typeof value === "string" && /^[a-zA-Z0-9_]{1,25}$/.test(value);
}

function isIvrUsers(value: unknown): value is IvrUser[] {
	return (
		Array.isArray(value) &&
		value.length <= BATCH_MAX &&
		value.every(
			(user) =>
				isRecord(user) &&
				(user.login === undefined || isLogin(user.login)) &&
				(user.logo === undefined ||
					(typeof user.logo === "string" && user.logo.length <= 2_048)),
		)
	);
}

function normalizeLogin(login: string): string | null {
	const normalized = login.toLowerCase();
	return isLogin(normalized) ? normalized : null;
}

function normalizeAvatarUrl(raw: string): string | null {
	try {
		const url = new URL(raw);
		return url.protocol === "https:" && !url.username && !url.password
			? downscaleAvatar(url.href)
			: null;
	} catch {
		return null;
	}
}

function setCached(login: string, value: string): void {
	cache.delete(login);
	cache.set(login, value);
	while (cache.size > MAX_CACHE_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) {
			break;
		}
		cache.delete(oldest);
	}
}

// The jtvnw profile URLs end in a size suffix ("-600x600.jpeg"). Avatars
// render at roughly 1.6em, so request the smallest offered 70x70 asset.
export function downscaleAvatar(url: string): string {
	return url.replace(/-\d+x\d+\.(?=[a-z]+$)/i, "-70x70.");
}

async function flush(logins: string[]): Promise<void> {
	activeRequests++;
	try {
		const users = await getJson<IvrUser[]>(
			`${USER_API}?login=${logins.map(encodeURIComponent).join(",")}`,
			{ validate: isIvrUsers },
		);
		const requested = new Set(logins);
		for (const user of users) {
			const login = user.login?.toLowerCase();
			if (!login || !requested.has(login)) {
				continue;
			}
			setCached(login, user.logo ? (normalizeAvatarUrl(user.logo) ?? "") : "");
		}
		// An absent login is banned, nonexistent or otherwise has no art.
		for (const login of logins) {
			if (!cache.has(login)) {
				setCached(login, "");
			}
		}
		failureCooldownUntil = 0;
	} catch {
		failureCooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
	} finally {
		for (const login of logins) {
			pending.delete(login);
		}
		activeRequests--;
		drainQueue();
	}
}

function drainQueue(): void {
	if (Date.now() < failureCooldownUntil) {
		for (const login of queue) {
			pending.delete(login);
		}
		queue = [];
		return;
	}
	while (queue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
		const batch = queue.splice(0, BATCH_MAX);
		void flush(batch);
	}
}

function schedule(): void {
	if (timer || queue.length === 0) {
		return;
	}
	timer = setTimeout(() => {
		timer = null;
		drainQueue();
	}, BATCH_WINDOW_MS);
}

// Resolved avatar for a login, or null when unknown, loading, or absent.
export function resolveAvatar(login: string): string | null {
	const normalized = normalizeLogin(login);
	if (!normalized) {
		return null;
	}
	const value = cache.get(normalized);
	if (value === undefined) {
		return null;
	}
	// Touch on read to make the bounded map a true LRU.
	setCached(normalized, value);
	return value || null;
}

// Fire-and-forget. Calls are deduped while pending and rejected while a
// provider failure cooldown is active, keeping message-rate work bounded.
export function warmAvatar(login: string): void {
	const normalized = normalizeLogin(login);
	if (
		!normalized ||
		cache.has(normalized) ||
		pending.has(normalized) ||
		Date.now() < failureCooldownUntil ||
		pending.size >= MAX_PENDING_LOGINS
	) {
		return;
	}
	pending.add(normalized);
	queue.push(normalized);
	schedule();
}

// Deterministic test reset for module-level timers and LRU state.
export function resetAvatarStateForTests(): void {
	if (timer) {
		clearTimeout(timer);
	}
	timer = null;
	queue = [];
	cache.clear();
	pending.clear();
	activeRequests = 0;
	failureCooldownUntil = 0;
}

export function avatarCacheSizeForTests(): number {
	return cache.size;
}
