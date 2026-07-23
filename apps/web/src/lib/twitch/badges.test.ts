import { describe, expect, test } from "bun:test";

import { gistIdFrom, parseCustomBadgeArt, parseGistBadgeArt } from "./badges";

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
