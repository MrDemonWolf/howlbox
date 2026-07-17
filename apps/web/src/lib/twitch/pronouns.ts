// Pronoun badges via pronouns.alejo.io: the de-facto Twitch pronoun
// service (7TV / FFZ / Chatterino all read it). Public, CORS *, no auth,
// so it fits the client-only rule. Two endpoints: a channel-independent
// id -> label definition list, and a per-login lookup that returns [] for
// a user who has not set one.
//
// Unlike emotes/badges this is per-USER, not per-channel, so there is no
// map to prefetch. A login is resolved lazily instead: warmPronoun kicks
// a cached fetch the first time a login is seen, resolvePronoun reads the
// sync cache at append time. The first message from a user can miss (no
// badge yet); every later message from them hits. Rows stay memoized
// because the resolved pronoun is just a primitive string.

import { cachedJson, ONE_HOUR_MS } from "@/lib/cache";

const PRONOUNS_API = "https://pronouns.alejo.io/api";
// definitions almost never change; keep them a day
const DEFS_TTL_MS = 24 * ONE_HOUR_MS;
// alejo serves user lookups with max-age=3600; match it
const USER_TTL_MS = ONE_HOUR_MS;

interface PronounDef {
	name?: string;
	display?: string;
}
interface UserPronoun {
	pronoun_id?: string;
}

// id -> display label ("hehim" -> "He/Him"); null until first loaded
let defs: Map<string, string> | null = null;
let defsPromise: Promise<void> | null = null;
// login -> display label, or "" for a user with no pronoun set (cached
// so we do not re-hit the API for them)
const cache = new Map<string, string>();
const inflight = new Set<string>();

async function loadDefs(): Promise<void> {
	if (defs) {
		return;
	}
	const list = await cachedJson<PronounDef[]>(
		"pronoun-defs",
		DEFS_TTL_MS,
		`${PRONOUNS_API}/pronouns`,
	);
	const map = new Map<string, string>();
	for (const def of list ?? []) {
		if (def.name && def.display) {
			map.set(def.name, def.display);
		}
	}
	defs = map;
}

// Resolved label for a login, or null when unknown, not yet loaded, or
// the user has no pronoun set.
export function resolvePronoun(login: string): string | null {
	return cache.get(login) || null;
}

// Fire-and-forget: ensure this login's pronoun is (being) fetched. Safe
// to call on every message; dedupes by login and by the cache entry.
export function warmPronoun(login: string): void {
	if (cache.has(login) || inflight.has(login)) {
		return;
	}
	inflight.add(login);
	void (async () => {
		try {
			if (!defsPromise) {
				defsPromise = loadDefs();
			}
			await defsPromise;
			const users = await cachedJson<UserPronoun[]>(
				`pronoun-user:${login}`,
				USER_TTL_MS,
				`${PRONOUNS_API}/users/${encodeURIComponent(login)}`,
			);
			const id = users?.[0]?.pronoun_id;
			// "" marks a resolved-but-unset user so we stop refetching them
			cache.set(login, (id && defs?.get(id)) || "");
		} catch {
			// overlay works fine without a pronoun badge; leave uncached so
			// a later message from this user can retry
		} finally {
			inflight.delete(login);
		}
	})();
}
