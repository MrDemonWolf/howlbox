// Drive the batching logic directly because a live overlay only reveals it
// when many new logins arrive inside the same 300ms window.

import { afterEach, beforeEach, expect, mock, test } from "bun:test";

import {
	resetAvatarStateForTests,
	resolveAvatar,
	warmAvatar,
} from "@/lib/twitch/avatars";

const realFetch = globalThis.fetch;

function logo(login: string) {
	return `https://static-cdn.jtvnw.net/jtv_user_pictures/${login}-profile_image-abc-600x600.png`;
}

beforeEach(() => {
	resetAvatarStateForTests();
});

afterEach(() => {
	resetAvatarStateForTests();
	globalThis.fetch = realFetch;
});

test("a burst of logins collapses into batched requests", async () => {
	const calls: string[][] = [];
	const fetchMock = mock((url: string) => {
		const logins = (new URL(url).searchParams.get("login") ?? "").split(",");
		calls.push(logins);
		return Promise.resolve({
			ok: true,
			json: () =>
				Promise.resolve(logins.map((login) => ({ login, logo: logo(login) }))),
		});
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;

	const logins = Array.from({ length: 60 }, (_, i) => `chatter${i}`);
	for (const login of logins) {
		warmAvatar(login);
	}
	for (const login of logins) {
		warmAvatar(login);
	}

	await Bun.sleep(900);

	expect(calls.length).toBe(2);
	expect(calls[0]?.length).toBe(50);
	expect(calls[1]?.length).toBe(10);
	expect(new Set(calls.flat()).size).toBe(60);
	expect(resolveAvatar("chatter0")).toBe(
		"https://static-cdn.jtvnw.net/jtv_user_pictures/chatter0-profile_image-abc-70x70.png",
	);
	expect(resolveAvatar("chatter59")).toBeTruthy();

	warmAvatar("chatter0");
	await Bun.sleep(400);
	expect(calls.length).toBe(2);
});

test("a login the API omits resolves empty instead of retrying forever", async () => {
	let requests = 0;
	globalThis.fetch = mock(() => {
		requests++;
		return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
	}) as unknown as typeof fetch;

	warmAvatar("ghost_user");
	await Bun.sleep(500);
	expect(requests).toBe(1);
	expect(resolveAvatar("ghost_user")).toBeNull();

	warmAvatar("ghost_user");
	await Bun.sleep(400);
	expect(requests).toBe(1);
});

test("concurrency stays capped while later batches wait", async () => {
	let active = 0;
	let peak = 0;
	const releases: (() => void)[] = [];
	globalThis.fetch = mock((url: string) => {
		active++;
		peak = Math.max(peak, active);
		const logins = (new URL(url).searchParams.get("login") ?? "").split(",");
		return new Promise((resolve) => {
			releases.push(() => {
				active--;
				resolve({
					ok: true,
					json: () =>
						Promise.resolve(
							logins.map((login) => ({ login, logo: logo(login) })),
						),
				});
			});
		});
	}) as unknown as typeof fetch;

	for (let i = 0; i < 120; i++) {
		warmAvatar(`busy${i}`);
	}
	await Bun.sleep(400);
	expect(releases.length).toBe(2);
	expect(peak).toBe(2);

	for (const release of releases.splice(0)) {
		release();
	}
	await Bun.sleep(25);
	expect(releases.length).toBe(1);
	releases[0]?.();
});

test("a provider outage opens a cooldown for other logins", async () => {
	let requests = 0;
	globalThis.fetch = mock(() => {
		requests++;
		return Promise.reject(new Error("provider down"));
	}) as unknown as typeof fetch;

	warmAvatar("failed_one");
	await Bun.sleep(500);
	warmAvatar("failed_two");
	await Bun.sleep(400);
	expect(requests).toBe(1);
	expect(resolveAvatar("failed_one")).toBeNull();
});
