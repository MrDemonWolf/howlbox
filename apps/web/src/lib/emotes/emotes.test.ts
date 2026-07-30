import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { resetCacheCooldownsForTests } from "@/lib/cache";

import { fetchEmoteMap } from "./emotes";

const realFetch = globalThis.fetch;
let requestUrls: string[];
let invalidBttv: boolean;

function installStorage() {
	const store = new Map<string, string>();
	(globalThis as { localStorage?: unknown }).localStorage = {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => store.set(key, value),
		removeItem: (key: string) => store.delete(key),
		key: (index: number) => [...store.keys()][index] ?? null,
		get length() {
			return store.size;
		},
	};
}

function payloadFor(url: string): unknown {
	if (url.includes("frankerfacez.com/v1/room/")) {
		return {
			room: { twitch_id: 42, set: 10 },
			sets: {
				"10": {
					emoticons: [
						{
							name: "FfzChannel",
							urls: { "1": "//cdn.example/ffz-channel-1.webp" },
							animated: { "4": "//cdn.example/ffz-channel-4.gif" },
						},
					],
				},
			},
		};
	}
	if (url.endsWith("7tv.io/v3/emote-sets/global")) {
		return {
			emotes: [
				{
					name: "SevenGlobal",
					data: {
						host: {
							url: "//cdn.7tv.app/emote/global",
							files: [
								{ name: "1x.webp", static_name: "1x_static.webp" },
								{ name: "3x.webp", static_name: "3x_static.webp" },
							],
						},
					},
				},
				{
					name: "SevenLegacy",
					data: { host: { url: "//cdn.7tv.app/emote/legacy" } },
				},
			],
		};
	}
	if (url.endsWith("betterttv.net/3/cached/emotes/global")) {
		return invalidBttv ? { not: "an array" } : [{ id: "abc", code: "Bttv" }];
	}
	if (url.endsWith("frankerfacez.com/v1/set/global")) {
		return {
			default_sets: [1],
			sets: {
				"1": {
					emoticons: [
						{
							name: "FfzGlobal",
							urls: { "1": "//cdn.example/ffz-global-1.webp" },
							animated: { "4": "//cdn.example/ffz-global-4.gif" },
						},
					],
				},
			},
		};
	}
	if (url.includes("7tv.io/v3/users/twitch/42")) {
		return { emote_set: { emotes: [] } };
	}
	if (url.includes("betterttv.net/3/cached/users/twitch/42")) {
		return { channelEmotes: [], sharedEmotes: [] };
	}
	throw new Error(`unexpected URL: ${url}`);
}

beforeEach(() => {
	requestUrls = [];
	invalidBttv = false;
	resetCacheCooldownsForTests();
	installStorage();
	globalThis.fetch = (async (input) => {
		const url = String(input);
		requestUrls.push(url);
		return { ok: true, json: async () => payloadFor(url) } as Response;
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = realFetch;
	(globalThis as { localStorage?: unknown }).localStorage = undefined;
});

describe("fetchEmoteMap media", () => {
	test("selects 1x static variants for OBS", async () => {
		const map = await fetchEmoteMap("channel", {
			assetScale: 1,
			staticMedia: true,
		});
		expect(map.get("SevenGlobal")?.url).toBe(
			"https://cdn.7tv.app/emote/global/1x_static.webp",
		);
		expect(map.get("SevenLegacy")?.url).toBe(
			"https://cdn.7tv.app/emote/legacy/1x_static.webp",
		);
		expect(map.get("Bttv")?.url).toBe(
			"https://cdn.betterttv.net/emote/abc/1x.png",
		);
		expect(map.get("FfzGlobal")?.url).toBe(
			"https://cdn.example/ffz-global-1.webp",
		);
	});

	test("selects larger animated variants when requested", async () => {
		const map = await fetchEmoteMap("channel", {
			assetScale: 3,
			staticMedia: false,
		});
		expect(map.get("SevenGlobal")?.url).toBe(
			"https://cdn.7tv.app/emote/global/3x.webp",
		);
		expect(map.get("Bttv")?.url).toBe(
			"https://cdn.betterttv.net/emote/abc/3x.webp",
		);
		expect(map.get("FfzGlobal")?.url).toBe(
			"https://cdn.example/ffz-global-4.gif",
		);
	});

	test("forced refresh bypasses only channel-scoped TTLs", async () => {
		await fetchEmoteMap("channel");
		requestUrls = [];
		await fetchEmoteMap("channel", { forceChannel: true });
		expect(requestUrls).toHaveLength(3);
		expect(requestUrls.some((url) => url.includes("/v1/room/channel"))).toBe(
			true,
		);
		expect(
			requestUrls.some((url) => url.endsWith("/v3/emote-sets/global")),
		).toBe(false);
		expect(
			requestUrls.some((url) => url.endsWith("/cached/emotes/global")),
		).toBe(false);
	});

	test("an invalid provider payload is isolated from valid providers", async () => {
		invalidBttv = true;
		const map = await fetchEmoteMap("channel");
		expect(map.has("Bttv")).toBe(false);
		expect(map.has("SevenGlobal")).toBe(true);
		expect(map.has("FfzGlobal")).toBe(true);
	});
});
