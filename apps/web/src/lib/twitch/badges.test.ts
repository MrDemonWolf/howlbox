import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { resetCacheCooldownsForTests } from "../cache";
import {
	fetchBadgeMap,
	gistIdFrom,
	parseCustomBadgeArt,
	parseGistBadgeArt,
} from "./badges";

const realFetch = globalThis.fetch;
let requestUrls: string[];
let invalidGlobal: boolean;

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

beforeEach(() => {
	requestUrls = [];
	invalidGlobal = false;
	resetCacheCooldownsForTests();
	installStorage();
	globalThis.fetch = (async (input) => {
		const url = String(input);
		requestUrls.push(url);
		const global = url.endsWith("/badges/global");
		const payload = global
			? invalidGlobal
				? { invalid: true }
				: [
						{
							set_id: "moderator",
							versions: [
								{
									id: "1",
									image_url_1x: "https://cdn.example/mod-1.png",
									image_url_2x: "https://cdn.example/mod-2.png",
									image_url_4x: "https://cdn.example/mod-4.png",
								},
							],
						},
					]
			: [
					{
						set_id: "subscriber",
						versions: [
							{
								id: "1",
								image_url_1x: "https://cdn.example/sub-1.png",
								image_url_2x: "https://cdn.example/sub-2.png",
								image_url_4x: "https://cdn.example/sub-4.png",
							},
						],
					},
				];
		return { ok: true, json: async () => payload } as Response;
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = realFetch;
	(globalThis as { localStorage?: unknown }).localStorage = undefined;
});

describe("fetchBadgeMap", () => {
	test("selects the requested provider image scale", async () => {
		const scale1 = await fetchBadgeMap("channel", { assetScale: 1 });
		expect(scale1.get("moderator/1")).toBe("https://cdn.example/mod-1.png");
		expect(scale1.get("subscriber/1")).toBe("https://cdn.example/sub-1.png");

		const scale3 = await fetchBadgeMap("other", { assetScale: 3 });
		expect(scale3.get("moderator/1")).toBe("https://cdn.example/mod-4.png");
		expect(scale3.get("subscriber/1")).toBe("https://cdn.example/sub-4.png");
	});

	test("forced refresh keeps the global badge TTL", async () => {
		await fetchBadgeMap("channel");
		requestUrls = [];
		await fetchBadgeMap("channel", { forceChannel: true });
		expect(requestUrls).toHaveLength(1);
		expect(requestUrls[0]).toContain("/badges/channel?");
	});

	test("invalid global payload does not hide valid channel badges", async () => {
		invalidGlobal = true;
		const map = await fetchBadgeMap("channel");
		expect(map.has("moderator/1")).toBe(false);
		expect(map.get("subscriber/1")).toBe("https://cdn.example/sub-1.png");
	});
});

describe("parseCustomBadgeArt", () => {
	test("parses set=url and set/version=url pairs", () => {
		expect(
			parseCustomBadgeArt(
				"moderator=https://ex.com/m.png, subscriber/1=https://ex.com/s.png",
			),
		).toEqual([
			["moderator", "https://ex.com/m.png"],
			["subscriber/1", "https://ex.com/s.png"],
		]);
	});

	test("rejects http and credential-bearing URLs, keeps the rest", () => {
		expect(
			parseCustomBadgeArt(
				"a=http://ex.com/a.png, b=https://user:pass@ex.com/b.png, c=https://ex.com/c.png",
			),
		).toEqual([["c", "https://ex.com/c.png"]]);
	});

	test("drops malformed pairs but stays nonfatal", () => {
		expect(
			parseCustomBadgeArt("noequals, =nokey, bad key=https://ex.com/x.png"),
		).toEqual([]);
	});

	test("caps the number of accepted entries", () => {
		const raw = Array.from(
			{ length: 500 },
			(_, i) => `set${i}=https://ex.com/${i}.png`,
		).join(",");
		expect(parseCustomBadgeArt(raw).length).toBe(200);
	});
});

describe("parseGistBadgeArt", () => {
	test("parses a JSON map", () => {
		expect(
			parseGistBadgeArt('{"moderator":"https://ex.com/m.png","x":"nope"}'),
		).toEqual([["moderator", "https://ex.com/m.png"]]);
	});

	test("parses newline-separated set=url lines", () => {
		expect(
			parseGistBadgeArt(
				"moderator=https://ex.com/m.png\nvip=https://ex.com/v.png",
			),
		).toEqual([
			["moderator", "https://ex.com/m.png"],
			["vip", "https://ex.com/v.png"],
		]);
	});

	test("drops content over the size cap", () => {
		const huge = `x=https://ex.com/${"a".repeat(70 * 1024)}.png`;
		expect(parseGistBadgeArt(huge)).toEqual([]);
	});
});

describe("gistIdFrom", () => {
	test("extracts the hex id from a URL or a bare id", () => {
		const id = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
		expect(gistIdFrom(`https://gist.github.com/you/${id}`)).toBe(id);
		expect(gistIdFrom(id)).toBe(id);
	});

	test("returns null when there is no id", () => {
		expect(gistIdFrom("not a gist")).toBeNull();
	});
});
