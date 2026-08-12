// Pronoun badges via pronouns.alejo.io. Lookups are lazy and synchronous
// at render time, while the network side uses bounded queues and caches so
// a long-running busy channel has a fixed memory and request ceiling.

import { cachedJson, ONE_HOUR_MS } from "@/lib/cache";

const PRONOUNS_API = "https://pronouns.alejo.io/api";
const DEFS_TTL_MS = 24 * ONE_HOUR_MS;
const USER_TTL_MS = ONE_HOUR_MS;
const MAX_CACHE_ENTRIES = 2_000;
const MAX_PENDING_LOGINS = 500;
const MAX_CONCURRENT_REQUESTS = 4;
const FAILURE_COOLDOWN_MS = 30_000;
const MAX_DEFINITIONS = 500;
const MAX_USER_RESULTS = 10;

interface PronounDef {
	name?: string;
	display?: string;
}
interface UserPronoun {
	pronoun_id?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isShortString(value: unknown, max = 256): value is string {
	return typeof value === "string" && value.length <= max;
}

function isPronounDefs(value: unknown): value is PronounDef[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.length <= MAX_DEFINITIONS &&
		value.every(
			(item) =>
				isRecord(item) &&
				isShortString(item.name) &&
				isShortString(item.display),
		)
	);
}

function isUserPronouns(value: unknown): value is UserPronoun[] {
	return (
		Array.isArray(value) &&
		value.length <= MAX_USER_RESULTS &&
		value.every((item) => isRecord(item) && isShortString(item.pronoun_id))
	);
}

function normalizeLogin(login: string): string | null {
	const normalized = login.toLowerCase();
	return /^[a-z0-9_]{1,25}$/.test(normalized) ? normalized : null;
}

// id -> display label ("hehim" -> "He/Him").
let defs: Map<string, string> | null = null;
let defsPromise: Promise<void> | null = null;
// login -> display label, or "" only after a successful empty response.
const cache = new Map<string, string>();
const pending = new Set<string>();
let queue: string[] = [];
let activeRequests = 0;
let failureCooldownUntil = 0;

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

async function loadDefs(): Promise<void> {
	if (defs) {
		return;
	}
	const list = await cachedJson<PronounDef[]>(
		"pronoun-defs",
		DEFS_TTL_MS,
		`${PRONOUNS_API}/pronouns`,
		{
			validate: isPronounDefs,
			cooldownKey: "pronouns-provider-definitions",
		},
	);
	if (list === null) {
		throw new Error("pronoun definitions unavailable");
	}
	const map = new Map<string, string>();
	for (const def of list) {
		if (def.name && def.display) {
			map.set(def.name, def.display);
		}
	}
	defs = map;
}

function ensureDefs(): Promise<void> {
	if (!defsPromise) {
		defsPromise = loadDefs().catch((error) => {
			defsPromise = null;
			throw error;
		});
	}
	return defsPromise;
}

async function loadUser(login: string): Promise<void> {
	activeRequests++;
	try {
		await ensureDefs();
		const users = await cachedJson<UserPronoun[]>(
			`pronoun-user:${login}`,
			USER_TTL_MS,
			`${PRONOUNS_API}/users/${encodeURIComponent(login)}`,
			{
				validate: isUserPronouns,
				cooldownKey: `pronouns-provider-user:${login}`,
			},
		);
		// A transport, HTTP or validation failure is null. It must not become
		// a negative cache entry, or one outage hides the badge for the session.
		if (users === null) {
			throw new Error("pronoun user lookup unavailable");
		}
		const id = users[0]?.pronoun_id;
		setCached(login, (id && defs?.get(id)) || "");
		failureCooldownUntil = 0;
	} catch {
		failureCooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
	} finally {
		pending.delete(login);
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
		const login = queue.shift();
		if (login) {
			void loadUser(login);
		}
	}
}

// Resolved label for a login, or null when unknown, loading, or unset.
export function resolvePronoun(login: string): string | null {
	const normalized = normalizeLogin(login);
	if (!normalized) {
		return null;
	}
	const value = cache.get(normalized);
	if (value === undefined) {
		return null;
	}
	setCached(normalized, value);
	return value || null;
}

// Fire-and-forget. Unique-user floods are limited by both the pending cap
// and concurrency, while a provider outage opens a short circuit breaker.
export function warmPronoun(login: string): void {
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
	drainQueue();
}

// Deterministic test reset for module-level queue and LRU state.
export function resetPronounStateForTests(): void {
	defs = null;
	defsPromise = null;
	cache.clear();
	pending.clear();
	queue = [];
	activeRequests = 0;
	failureCooldownUntil = 0;
}

export function pronounCacheSizeForTests(): number {
	return cache.size;
}

export function resetPronounCooldownForTests(): void {
	failureCooldownUntil = 0;
}
