import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { cachedJson, ONE_HOUR_MS } from "./cache";

const PREFIX = "hb-cache-v1:";

// A controllable in-memory localStorage stub. Bun's test runtime has no
// localStorage, so cache.ts sees whatever we hang off globalThis here.
interface Stub {
	store: Map<string, string>;
	throwOnGet: boolean;
	throwOnSet: boolean;
}

let stub: Stub;
const realFetch = globalThis.fetch;
let fetchCount: number;
let fetchImpl: () => Promise<unknown>;

function installLocalStorage(s: Stub) {
	const ls = {
		getItem(key: string) {
			if (s.throwOnGet) {
				throw new Error("SecurityError");
			}
			return s.store.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			if (s.throwOnSet) {
				throw new Error("QuotaExceededError");
			}
			s.store.set(key, value);
		},
		removeItem(key: string) {
			s.store.delete(key);
		},
		key(i: number) {
			return [...s.store.keys()][i] ?? null;
		},
		get length() {
			return s.store.size;
		},
	};
	(globalThis as { localStorage?: unknown }).localStorage = ls;
}

beforeEach(() => {
	stub = { store: new Map(), throwOnGet: false, throwOnSet: false };
	installLocalStorage(stub);
	fetchCount = 0;
	fetchImpl = async () => ({ n: 1 });
	globalThis.fetch = (async () => {
		fetchCount++;
		const value = await fetchImpl();
		return { ok: true, json: async () => value } as Response;
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = realFetch;
	(globalThis as { localStorage?: unknown }).localStorage = undefined;
});

// Force the stored entry's timestamp into the past so it reads as stale.
function ageEntry(key: string) {
	const raw = stub.store.get(PREFIX + key);
	if (!raw) {
		return;
	}
	const parsed = JSON.parse(raw);
	parsed.t = Date.now() - 10 * ONE_HOUR_MS;
	stub.store.set(PREFIX + key, JSON.stringify(parsed));
}

describe("cachedJson", () => {
	test("serves a fresh cached value without refetching", async () => {
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
		expect(fetchCount).toBe(1);
	});

	test("refetches once the entry is past its TTL", async () => {
		await cachedJson("k", ONE_HOUR_MS, "u");
		ageEntry("k");
		fetchImpl = async () => ({ n: 2 });
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 2 });
		expect(fetchCount).toBe(2);
	});

	test("a corrupt entry is dropped and refetched", async () => {
		stub.store.set(`${PREFIX}k`, "{not valid json");
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
		expect(fetchCount).toBe(1);
	});

	test("a valid-JSON but wrong-shape entry is treated as a miss", async () => {
		stub.store.set(`${PREFIX}k`, JSON.stringify({ foo: 1 }));
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
	});

	test("a quota error on write does not throw and still returns fresh", async () => {
		stub.throwOnSet = true;
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
	});

	test("unavailable storage degrades to always-fetch without throwing", async () => {
		stub.throwOnGet = true;
		stub.throwOnSet = true;
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
	});

	test("serves the stale value when the refetch fails", async () => {
		await cachedJson("k", ONE_HOUR_MS, "u");
		ageEntry("k");
		fetchImpl = async () => {
			throw new Error("network down");
		};
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toEqual({ n: 1 });
	});

	test("returns null when nothing is cached and the fetch fails", async () => {
		fetchImpl = async () => {
			throw new Error("network down");
		};
		expect(await cachedJson("k", ONE_HOUR_MS, "u")).toBeNull();
	});
});
