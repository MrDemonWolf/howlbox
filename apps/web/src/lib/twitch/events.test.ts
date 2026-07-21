// Bun's built-in runner (bun test), so this adds no dependency. Covers
// the pure pieces the overlay cannot show us directly: event line
// wording, cheer tier bucketing, the avatar downscale, and the
// events/avatars URL round trip.

import { describe, expect, test } from "bun:test";

import { normalizeEventList, overlayParamsSchema } from "@/lib/overlay/params";
import { overlayQuery } from "@/lib/overlay/url";
import { downscaleAvatar } from "@/lib/twitch/avatars";
import {
	cheerTier,
	createGiftDeduper,
	describeCommunitySub,
	describeFirstChat,
	describeRaid,
	describeResub,
	describeSub,
	describeSubGift,
	gifterKey,
	isStandaloneEvent,
	planLabel,
} from "@/lib/twitch/events";
import type { ChatEventKind } from "@/lib/twitch/types";

describe("event lines", () => {
	test("tier names", () => {
		expect(planLabel("1000")).toBe("Tier 1");
		expect(planLabel("3000")).toBe("Tier 3");
		expect(planLabel("Prime")).toBe("Prime");
		// an unknown plan id must not render "undefined" on stream
		expect(planLabel("9999")).toBe("Tier 1");
	});

	test("new sub names the subscriber", () => {
		expect(describeSub("Luna", "1000").text).toBe(
			"Luna subscribed with Tier 1",
		);
	});

	test("resub only mentions a streak when one was shared", () => {
		expect(describeResub("Luna", "2000", 12, 5).text).toBe(
			"Luna resubscribed with Tier 2 for 12 months, 5 in a row",
		);
		expect(describeResub("Luna", "2000", 1).text).toBe(
			"Luna resubscribed with Tier 2 for 1 month",
		);
	});

	test("gift falls back to anonymous", () => {
		expect(describeSubGift("1000", "Bob", "Luna").text).toBe(
			"Luna gifted a Tier 1 sub to Bob",
		);
		expect(describeSubGift("1000", "Bob").text).toBe(
			"An anonymous gifter gifted a Tier 1 sub to Bob",
		);
		expect(describeSubGift("1000", "Bob", "Luna", 3).text).toBe(
			"Luna gifted a Tier 1 sub to Bob (3 months)",
		);
	});

	test("mass gift pluralises the sub count", () => {
		expect(describeCommunitySub("1000", 5, "Luna").text).toBe(
			"Luna gifted 5 Tier 1 subs to the community",
		);
		expect(describeCommunitySub("1000", 1, "Luna").text).toBe(
			"Luna gifted 1 Tier 1 sub to the community",
		);
	});

	test("raid reports the viewer count", () => {
		expect(describeRaid("Luna", 42).text).toBe(
			"Luna is raiding with 42 viewers",
		);
		expect(describeRaid("Luna", 1).text).toBe("Luna is raiding with 1 viewer");
	});

	test("first chat distinguishes returning chatters", () => {
		expect(describeFirstChat(false).text).toBe("First message in this channel");
		expect(describeFirstChat(true).text).toBe("Returning chatter");
	});

	test("standalone rows drop the author header, attached rows keep it", () => {
		expect(isStandaloneEvent("sub")).toBe(true);
		expect(isStandaloneEvent("raid")).toBe(true);
		expect(isStandaloneEvent("cheer")).toBe(false);
		expect(isStandaloneEvent("first")).toBe(false);
		expect(isStandaloneEvent("announce")).toBe(false);
	});
});

// Sequence captured live from midnightsumo: one submysterygift for five,
// then exactly five subgift notices from the same gifter. Before the
// deduper this rendered six rows for one gift bomb.
describe("mass gift dedupe", () => {
	test("the per-recipient notices behind a batch are swallowed", () => {
		const gifts = createGiftDeduper();
		const key = gifterKey("1234", "nonegoodleft");
		const t = 1_000_000;

		gifts.announce(key, 5, t);
		const recipients = [
			"zosajmp",
			"Scaleta",
			"rod2ak",
			"Milhouse219",
			"littlebigcampus",
		];
		const claimed = recipients.map((_, i) => gifts.claim(key, t + i * 40));
		expect(claimed).toEqual([true, true, true, true, true]);

		// a sixth gift is not part of the batch and must render
		expect(gifts.claim(key, t + 300)).toBe(false);
	});

	test("a standalone gift from the same person still renders", () => {
		const gifts = createGiftDeduper();
		const key = gifterKey("1234", "nonegoodleft");
		expect(gifts.claim(key, 5_000)).toBe(false);
	});

	test("a batch that never delivers expires instead of eating later gifts", () => {
		const gifts = createGiftDeduper(60_000);
		const key = gifterKey("1234", "nonegoodleft");
		gifts.announce(key, 100, 0);
		expect(gifts.claim(key, 1_000)).toBe(true);
		// long after the bomb, an unrelated gift from the same user renders
		expect(gifts.claim(key, 120_000)).toBe(false);
	});

	test("gifters do not consume each other's batches", () => {
		const gifts = createGiftDeduper();
		gifts.announce(gifterKey("1", "alice"), 2, 0);
		expect(gifts.claim(gifterKey("2", "bob"), 10)).toBe(false);
		expect(gifts.claim(gifterKey("1", "alice"), 10)).toBe(true);
	});

	test("anonymous gifters share one bucket", () => {
		const gifts = createGiftDeduper();
		gifts.announce(gifterKey(undefined, undefined), 1, 0);
		expect(gifts.claim(gifterKey(undefined, undefined), 10)).toBe(true);
	});
});

describe("cheer tiers", () => {
	test("bucket down to the tier actually reached", () => {
		expect(cheerTier(1)).toBe(1);
		expect(cheerTier(99)).toBe(1);
		expect(cheerTier(100)).toBe(100);
		expect(cheerTier(1500)).toBe(1000);
		expect(cheerTier(999999)).toBe(10000);
		// a malformed bits count must still pick a real tier
		expect(cheerTier(0)).toBe(1);
	});
});

describe("avatar downscale", () => {
	test("swaps the size segment", () => {
		expect(
			downscaleAvatar(
				"https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-600x600.jpeg",
			),
		).toBe(
			"https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-70x70.jpeg",
		);
	});

	test("leaves a URL without the pattern alone", () => {
		const odd = "https://example.com/avatar.png";
		expect(downscaleAvatar(odd)).toBe(odd);
	});
});

describe("params", () => {
	test("event list drops junk and expands all", () => {
		expect(normalizeEventList("sub,raid")).toEqual(["sub", "raid"]);
		expect(normalizeEventList("RAID, sub")).toEqual(["sub", "raid"]);
		expect(normalizeEventList("sub,nonsense")).toEqual(["sub"]);
		expect(normalizeEventList("")).toEqual([]);
		expect(normalizeEventList("all")).toEqual([
			"sub",
			"cheer",
			"raid",
			"first",
			"announce",
		]);
	});

	test("bad avatars value falls back rather than blanking the overlay", () => {
		expect(overlayParamsSchema.parse({ avatars: "nonsense" }).avatars).toBe(
			"off",
		);
		expect(overlayParamsSchema.parse({ avatars: "subs" }).avatars).toBe("subs");
	});

	test("events and avatars round trip through the query string", () => {
		const config = {
			channel: "mrdemonwolf",
			theme: "wolf",
			bg: "off",
			size: 100,
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
			events: ["sub", "raid"] as ChatEventKind[],
			avatars: "subs" as const,
		};
		const parsed = overlayParamsSchema.parse(
			Object.fromEntries(new URLSearchParams(overlayQuery(config))),
		);
		expect(parsed.events).toEqual(["sub", "raid"]);
		expect(parsed.avatars).toBe("subs");
	});

	test("defaults stay out of the query string", () => {
		const query = overlayQuery({
			channel: "mrdemonwolf",
			theme: "wolf",
			bg: "off",
			size: 100,
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
		expect(query).toBe("channel=mrdemonwolf");
	});
});
