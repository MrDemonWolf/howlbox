// The batcher is the part a live overlay cannot prove on demand: it only
// shows itself when many new logins land inside the same 300ms window,
// which needs a chat burst to happen naturally. Drive it directly here.

import { expect, mock, test } from "bun:test";

import { resolveAvatar, warmAvatar } from "@/lib/twitch/avatars";

function logo(login: string) {
	return `https://static-cdn.jtvnw.net/jtv_user_pictures/${login}-profile_image-abc-600x600.png`;
}

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

	// 60 logins in one tick: one full batch of 50, then the remainder
	const logins = Array.from({ length: 60 }, (_, i) => `chatter${i}`);
	for (const login of logins) {
		warmAvatar(login);
	}
	// repeats inside the same window must not queue twice
	for (const login of logins) {
		warmAvatar(login);
	}

	await Bun.sleep(900);

	expect(calls.length).toBe(2);
	expect(calls[0]?.length).toBe(50);
	expect(calls[1]?.length).toBe(10);
	// every login resolved exactly once, at the downscaled size
	expect(new Set(calls.flat()).size).toBe(60);
	expect(resolveAvatar("chatter0")).toBe(
		"https://static-cdn.jtvnw.net/jtv_user_pictures/chatter0-profile_image-abc-70x70.png",
	);
	expect(resolveAvatar("chatter59")).toBeTruthy();

	// an already-resolved login costs no further request
	warmAvatar("chatter0");
	await Bun.sleep(400);
	expect(calls.length).toBe(2);
});

test("a login the API omits resolves empty instead of retrying forever", async () => {
	let requests = 0;
	globalThis.fetch = mock(() => {
		requests++;
		// ivr.fi returns [] for a banned or nonexistent login
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
