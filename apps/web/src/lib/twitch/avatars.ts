// Profile pictures via api.ivr.fi, the same tokenless open-CORS service
// the badge art comes from. Helix would need a token, so this is the
// only way to get an avatar inside the client-only rule.
//
// Per-USER like pronouns.ts, so there is no map to prefetch and the same
// lazy shape applies: warmAvatar kicks a lookup on first sight of a
// login, resolveAvatar reads the sync cache at append time. The first
// message from a user misses the picture; repeats hit.
//
// Unlike pronouns this batches. ivr.fi takes a comma list of logins in
// one request, so a busy channel costs a handful of calls instead of one
// per chatter. Logins collect for a beat, then flush together.

import { getJson } from "@/lib/cache";

const USER_API = "https://api.ivr.fi/v2/twitch/user";
// collect logins arriving in the same burst before firing
const BATCH_WINDOW_MS = 300;
// ivr.fi handles long lists fine; this keeps the URL sane
const BATCH_MAX = 50;

// login -> avatar url, or "" for a user with no picture / a failed
// lookup we do not want to retry on every message
const cache = new Map<string, string>();
// logins already requested (pending or resolved), so a fast chat does
// not queue the same login a hundred times
const seen = new Set<string>();
let queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

interface IvrUser {
	login?: string;
	logo?: string;
}

// The jtvnw profile URLs end in a size suffix ("-600x600.jpeg"). Avatars
// render at roughly 1.6em, so pull the smallest offered size: 70x70 is
// ~1.7 KB against ~16 KB for the 600 the API returns. A URL that does
// not match the pattern is used as-is rather than mangled.
export function downscaleAvatar(url: string): string {
	return url.replace(/-\d+x\d+\.(?=[a-z]+$)/i, "-70x70.");
}

async function flush(logins: string[]): Promise<void> {
	try {
		const users = await getJson<IvrUser[]>(
			`${USER_API}?login=${logins.map(encodeURIComponent).join(",")}`,
		);
		for (const user of users ?? []) {
			if (user.login) {
				cache.set(user.login, user.logo ? downscaleAvatar(user.logo) : "");
			}
		}
	} catch {
		// overlay works fine without pictures; drop these logins from seen
		// so a later message from them can retry
		for (const login of logins) {
			if (!cache.has(login)) {
				seen.delete(login);
			}
		}
		return;
	}
	// a banned or nonexistent login is simply absent from the response;
	// mark it resolved-empty so we stop asking for it
	for (const login of logins) {
		if (!cache.has(login)) {
			cache.set(login, "");
		}
	}
}

function schedule() {
	if (timer) {
		return;
	}
	timer = setTimeout(() => {
		timer = null;
		const batch = queue.slice(0, BATCH_MAX);
		queue = queue.slice(BATCH_MAX);
		if (batch.length > 0) {
			void flush(batch);
		}
		// more than one batch worth arrived at once: keep draining
		if (queue.length > 0) {
			schedule();
		}
	}, BATCH_WINDOW_MS);
}

// Resolved avatar for a login, or null when unknown, still loading, or
// the user has no picture.
export function resolveAvatar(login: string): string | null {
	return cache.get(login) || null;
}

// Fire-and-forget: ensure this login's avatar is (being) fetched. Safe to
// call on every message; deduped by the seen set.
export function warmAvatar(login: string): void {
	if (seen.has(login)) {
		return;
	}
	seen.add(login);
	queue.push(login);
	schedule();
}
