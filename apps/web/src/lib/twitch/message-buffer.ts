// Pure moderation/buffer logic for the chat hook, lifted out of the
// effect closure so it can be unit-tested on its own. Nothing here
// touches React or timers: the hook still owns setState and setTimeout,
// and calls these for the filtering, dedupe, cap and delay-buffer
// decisions.

import { isStandaloneEvent } from "@/lib/twitch/events";
import type { ChatMessageView } from "@/lib/twitch/types";

export interface FilterOptions {
	hidden: ReadonlySet<string>;
	// featured mode: when non-empty, ONLY these logins render
	allowed: ReadonlySet<string>;
	hideCommands: boolean;
}

// Whether an incoming message should be rendered at all. A standalone
// event (a raid or gift system line) is never treated as a "!command".
export function passesFilters(
	raw: ChatMessageView,
	{ hidden, allowed, hideCommands }: FilterOptions,
): boolean {
	if (hidden.has(raw.login)) {
		return false;
	}
	if (allowed.size > 0 && !allowed.has(raw.login)) {
		return false;
	}
	if (hideCommands && !(raw.event && isStandaloneEvent(raw.event.kind))) {
		const first = raw.parts[0];
		if (first?.type === "text" && first.text.trimStart().startsWith("!")) {
			return false;
		}
	}
	return true;
}

// Append with dedupe-by-id and a hard cap on the visible list. A message
// whose id is already present is dropped (Twitch can re-send on reconnect).
export function appendCapped(
	list: ChatMessageView[],
	message: ChatMessageView,
	max: number,
): ChatMessageView[] {
	if (list.some((m) => m.id === message.id)) {
		return list;
	}
	// One copy on the hot path: slice the retained tail, then append in place.
	const next = list.slice(Math.max(0, list.length - max + 1));
	next.push(message);
	return next;
}

export function removeById(
	list: ChatMessageView[],
	id: string,
): ChatMessageView[] {
	if (!list.some((m) => m.id === id)) {
		return list;
	}
	return list.filter((m) => m.id !== id);
}

export function removeByLogin(
	list: ChatMessageView[],
	login: string,
): ChatMessageView[] {
	if (!list.some((m) => m.login === login)) {
		return list;
	}
	return list.filter((m) => m.login !== login);
}

// Bounded holding area for delayed (non-privileged) messages waiting out
// the moderation delay. Stores an entry per id; the hook keeps the timer
// on that entry. Eviction, promotion and moderation drops all return the
// affected entries so the hook can clear their timers.
export class PendingBuffer<E extends { message: ChatMessageView }> {
	private map = new Map<string, E>();

	constructor(private readonly maxPending: number) {}

	get size(): number {
		return this.map.size;
	}

	// Add an entry, evicting the oldest first when full. A duplicate id keeps
	// the original entry and discards the new one, so its original moderation
	// delay cannot be shortened by a reconnect replay. Returns whichever entry
	// was discarded (so its timer can be cleared) or null.
	add(id: string, entry: E): E | null {
		if (this.map.has(id)) {
			return entry;
		}
		let evicted: E | null = null;
		if (this.map.size >= this.maxPending) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) {
				evicted = this.map.get(oldest) ?? null;
				this.map.delete(oldest);
			}
		}
		this.map.set(id, entry);
		return evicted;
	}

	// Remove and return the entry for id (promotion out of the buffer).
	take(id: string): E | null {
		const entry = this.map.get(id) ?? null;
		this.map.delete(id);
		return entry;
	}

	// Drop every entry whose message matches, returning them so their timers
	// can be cleared. Covers a delete (by id), a timeout or ban (by login).
	drop(predicate: (message: ChatMessageView) => boolean): E[] {
		const dropped: E[] = [];
		for (const [id, entry] of this.map) {
			if (predicate(entry.message)) {
				dropped.push(entry);
				this.map.delete(id);
			}
		}
		return dropped;
	}

	clear(): E[] {
		const all = [...this.map.values()];
		this.map.clear();
		return all;
	}
}
