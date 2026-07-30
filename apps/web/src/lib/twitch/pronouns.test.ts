import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { resetCacheCooldownsForTests } from "../cache";
import {
	resetPronounCooldownForTests,
	resetPronounStateForTests,
	resolvePronoun,
	warmPronoun,
} from "./pronouns";

const realFetch = globalThis.fetch;
const DEFS = [{ name: "hehim", display: "He/Him" }];
const flush = () => new Promise((resolve) => setTimeout(resolve, 25));

let defsShouldFail: boolean;
let failedUsers: Set<string>;
let userRequests: Map<string, number>;

beforeEach(() => {
	resetPronounStateForTests();
	resetCacheCooldownsForTests();
	defsShouldFail = false;
	failedUsers = new Set();
	userRequests = new Map();
	(globalThis as { localStorage?: unknown }).localStorage = undefined;
	globalThis.fetch = (async (input: string) => {
		const url = String(input);
		if (url.endsWith("/pronouns")) {
			if (defsShouldFail) {
				throw new Error("defs down");
			}
			return { ok: true, json: async () => DEFS } as Response;
		}
		const login = url.split("/users/")[1] ?? "";
		userRequests.set(login, (userRequests.get(login) ?? 0) + 1);
		if (failedUsers.has(login)) {
			throw new Error("user endpoint down");
		}
		const map: Record<string, unknown[]> = {
			userb: [{ pronoun_id: "hehim" }],
			userd: [{ pronoun_id: "hehim" }],
			userc: [],
		};
		return { ok: true, json: async () => map[login] ?? [] } as Response;
	}) as typeof fetch;
});

afterEach(() => {
	resetPronounStateForTests();
	resetCacheCooldownsForTests();
	globalThis.fetch = realFetch;
});

describe("pronoun loading", () => {
	test("a failed definitions fetch leaves the login uncached", async () => {
		defsShouldFail = true;
		warmPronoun("usera");
		await flush();
		expect(resolvePronoun("usera")).toBeNull();
	});

	test("a definitions failure can retry after its cooldown", async () => {
		defsShouldFail = true;
		warmPronoun("userb");
		await flush();
		expect(resolvePronoun("userb")).toBeNull();

		defsShouldFail = false;
		resetPronounCooldownForTests();
		resetCacheCooldownsForTests();
		warmPronoun("userb");
		await flush();
		expect(resolvePronoun("userb")).toBe("He/Him");
	});

	test("a failed user response is not negative cached", async () => {
		failedUsers.add("userd");
		warmPronoun("userd");
		await flush();
		expect(resolvePronoun("userd")).toBeNull();

		failedUsers.delete("userd");
		resetPronounCooldownForTests();
		resetCacheCooldownsForTests();
		warmPronoun("userd");
		await flush();
		expect(resolvePronoun("userd")).toBe("He/Him");
		expect(userRequests.get("userd")).toBe(2);
	});

	test("a successful empty response is negative cached", async () => {
		warmPronoun("userc");
		await flush();
		expect(resolvePronoun("userc")).toBeNull();
		warmPronoun("userc");
		await flush();
		expect(userRequests.get("userc")).toBe(1);
	});

	test("a user with a pronoun set resolves to its label", async () => {
		warmPronoun("userd");
		await flush();
		expect(resolvePronoun("userd")).toBe("He/Him");
	});

	test("a provider outage cools down lookups for other users", async () => {
		failedUsers.add("usera");
		warmPronoun("usera");
		await flush();
		warmPronoun("another_user");
		await flush();
		expect(userRequests.get("usera")).toBe(1);
		expect(userRequests.has("another_user")).toBe(false);
	});
});
