import { describe, expect, test } from "bun:test";
import { defaultParseSearch } from "@tanstack/react-router";

import { overlayParamsSchema } from "./params";
import { parseOverlaySearch } from "./parse-search";

const CASES = [
	"",
	"channel=xqc&theme=neon&bg=panel&size=125&max=100&delay=10&fade=30",
	"channel=XQC&hidebots&hide=NightBot,bad!name&allow=featured&badges=false",
	"timestamps=yes&animate=off&media=static&pronouns=1&avatars=subs",
	"events=all&badgeart=moderator%3Dhttps%3A%2F%2Fexample.com%2Fm.png",
	"theme=unknown&bg=bad&size=8&max=true&delay=-1&fade=9999&refresh=3",
	"badges=unexpected&animate=unexpected&hidecommands=unexpected",
	"channel=first&channel=second&theme=dark&theme=light",
	"hide=first&hide=second&events=sub&events=raid",
	"channel=123456&size=125&badges=0&hidebots=1",
	"channel=%22123456%22&hide=%5B%22first%22%2C%22second%22%5D&events=%5B%22sub%22%2C%22raid%22%5D",
	"size=%5B125%5D&badgeart=%7B%22bad%22%3Atrue%7D",
	// emotescale is the one non-integer param, so its snapping and its
	// fallbacks have to agree between the two parsers as well
	"emotescale=2.5&size=150",
	"emotescale=2.3",
	"emotescale=9&max=10",
	"emotescale=true&emotescale=1.5",
] as const;

describe("parseOverlaySearch", () => {
	test("matches the canonical Zod schema for raw URL values", () => {
		for (const query of CASES) {
			const search = new URLSearchParams(query);
			const canonical = overlayParamsSchema.parse(defaultParseSearch(query));
			expect(parseOverlaySearch(search)).toEqual(canonical);
		}
	});
});
