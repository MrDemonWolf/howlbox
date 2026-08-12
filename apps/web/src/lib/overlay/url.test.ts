import { describe, expect, test } from "bun:test";

import type { OverlayConfig } from "./url";
import { overlayQuery, parseOverlayUrl } from "./url";

const FULL: OverlayConfig = {
	channel: "xqc",
	theme: "neon",
	bg: "panel",
	size: 125,
	emotescale: 2.5,
	max: 100,
	delay: 10,
	fade: 30,
	hidebots: true,
	hidecommands: true,
	timestamps: true,
	badges: false,
	animate: false,
	pronouns: true,
	hide: ["somebot", "anotheruser"],
	allow: ["featured"],
	badgeart: "moderator=https://example.com/mod.png",
	badgegist: "https://gist.github.com/you/abc123",
	refresh: 720,
	events: ["sub", "cheer"],
	avatars: "subs",
};

describe("overlayQuery", () => {
	test("omits every value left at its default", () => {
		const qs = overlayQuery({
			...FULL,
			theme: "wolf",
			bg: "off",
			size: 100,
			emotescale: 1,
			max: 50,
			delay: 0,
			fade: 0,
			hidebots: false,
			hidecommands: false,
			timestamps: false,
			badges: true,
			animate: true,
			pronouns: false,
			hide: [],
			allow: [],
			badgeart: "",
			badgegist: "",
			refresh: 5,
			events: [],
			avatars: "off",
		});
		// only the channel survives when everything else is default
		expect(qs).toBe("channel=xqc");
	});

	test("a channel-less config still names a placeholder channel", () => {
		const params = new URLSearchParams(overlayQuery({ ...FULL, channel: "" }));
		expect(params.get("channel")).toBe("your_channel");
	});

	test("every selected event serializes to the all shorthand", () => {
		const qs = overlayQuery({
			...FULL,
			events: ["sub", "cheer", "raid", "first", "announce"],
		});
		expect(new URLSearchParams(qs).get("events")).toBe("all");
	});
});

describe("parseOverlayUrl", () => {
	test("accepts a full URL, a bare query, and a ?-prefixed query", () => {
		for (const raw of [
			"https://host.tld/howlbox/overlay?channel=xqc&theme=neon",
			"channel=xqc&theme=neon",
			"?channel=xqc&theme=neon",
		]) {
			const parsed = parseOverlayUrl(raw);
			expect(parsed?.channel).toBe("xqc");
			expect(parsed?.theme).toBe("neon");
		}
	});

	test("strips a trailing fragment", () => {
		expect(parseOverlayUrl("channel=xqc#anchor")?.channel).toBe("xqc");
	});

	test("returns null when no known param is present", () => {
		expect(parseOverlayUrl("hello world")).toBeNull();
		expect(parseOverlayUrl("")).toBeNull();
		expect(parseOverlayUrl("unrelated=1&foo=bar")).toBeNull();
	});
});

describe("round trip", () => {
	test("a full config survives overlayQuery -> parseOverlayUrl", () => {
		const parsed = parseOverlayUrl(overlayQuery(FULL));
		expect(parsed).not.toBeNull();
		if (!parsed) {
			return;
		}
		expect(parsed.channel).toBe(FULL.channel);
		expect(parsed.theme).toBe(FULL.theme);
		expect(parsed.bg).toBe(FULL.bg);
		expect(parsed.size).toBe(FULL.size);
		expect(parsed.emotescale).toBe(FULL.emotescale);
		expect(parsed.max).toBe(FULL.max);
		expect(parsed.delay).toBe(FULL.delay);
		expect(parsed.fade).toBe(FULL.fade);
		expect(parsed.hidebots).toBe(FULL.hidebots);
		expect(parsed.hidecommands).toBe(FULL.hidecommands);
		expect(parsed.timestamps).toBe(FULL.timestamps);
		expect(parsed.badges).toBe(FULL.badges);
		expect(parsed.animate).toBe(FULL.animate);
		expect(parsed.pronouns).toBe(FULL.pronouns);
		expect(parsed.hide).toEqual(FULL.hide);
		expect(parsed.allow).toEqual(FULL.allow);
		expect(parsed.badgeart).toBe(FULL.badgeart);
		expect(parsed.badgegist).toBe(FULL.badgegist);
		expect(parsed.refresh).toBe(FULL.refresh);
		expect(parsed.events).toEqual(FULL.events);
		expect(parsed.avatars).toBe(FULL.avatars);
	});
});
