import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { resolvePronoun, warmPronoun } from "./pronouns";

// The module holds its definition map and per-login cache at module
// scope, so these tests use a distinct login each and run the
// failure-then-retry case in order: the failure must land before any
// success sets the shared defs map.

const realFetch = globalThis.fetch;
let defsShouldFail: boolean;

const DEFS = [{ name: "hehim", display: "He/Him" }];

const flush = () => new Promise((r) => setTimeout(r, 25));

beforeEach(() => {
	// no localStorage in the test runtime; force cachedJson to always fetch
	(globalThis as { localStorage?: unknown }).localStorage = undefined;
	globalThis.fetch = (async (input: string) => {
		const url = String(input);
		if (url.endsWith("/pronouns")) {
			if (defsShouldFail) {
				throw new Error("defs down");
			}
			return { ok: true, json: async () => DEFS } as Response;
		}
		// per-user endpoint: /users/<login>
		const login = url.split("/users/")[1] ?? "";
		const map: Record<string, unknown[]> = {
			userb: [{ pronoun_id: "hehim" }],
			userd: [{ pronoun_id: "hehim" }],
			userc: [], // user with no pronoun set
		};
		return { ok: true, json: async () => map[login] ?? [] } as Response;
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = realFetch;
});

describe("pronoun loading", () => {
	test("a failed definitions fetch leaves the login uncached", async () => {
		defsShouldFail = true;
		warmPronoun("usera");
		await flush();
		expect(resolvePronoun("usera")).toBeNull();
	});

	test("a later message retries and resolves after the earlier failure", async () => {
		// same session, defs now reachable: the poisoned-promise fix must let
		// this succeed rather than reusing the earlier rejection forever
		defsShouldFail = false;
		warmPronoun("userb");
		await flush();
		expect(resolvePronoun("userb")).toBe("He/Him");
	});

	test("a user with no pronoun set resolves to null and is not retried", async () => {
		warmPronoun("userc");
		await flush();
		expect(resolvePronoun("userc")).toBeNull();
	});

	test("a user with a pronoun set resolves to its label", async () => {
		warmPronoun("userd");
		await flush();
		expect(resolvePronoun("userd")).toBe("He/Him");
	});
});
