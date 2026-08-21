import { describe, expect, test } from "bun:test";

import {
	assetScaleFor,
	isValidLogin,
	normalizeLoginList,
	OVERLAY_DEFAULTS,
	overlayParamsSchema,
} from "./params";

describe("isValidLogin", () => {
	test("accepts valid Twitch logins", () => {
		for (const login of ["xqc", "a", "user_123", "z".repeat(25)]) {
			expect(isValidLogin(login)).toBe(true);
		}
	});

	test("rejects the configurator's bad-channel cases", () => {
		for (const bad of [
			"", // empty
			"a b c", // spaces
			"https://twitch.tv/xqc", // a URL
			"@name", // leading @
			"bad!name", // invalid character
			"a".repeat(26), // over the 25-char limit
			"UPPER", // regex is lowercase-only (input is lowercased first)
		]) {
			expect(isValidLogin(bad)).toBe(false);
		}
	});
});

describe("normalizeLoginList", () => {
	test("keeps valid logins, lowercases, and drops junk", () => {
		expect(normalizeLoginList("XQC, Bad!Name, nightbot,  , foo bar")).toEqual([
			"xqc",
			"nightbot",
		]);
	});

	test("empty string yields an empty list", () => {
		expect(normalizeLoginList("")).toEqual([]);
	});
});

describe("assetScaleFor", () => {
	test("uses only the resolution needed by the configured size", () => {
		expect(assetScaleFor(50)).toBe(1);
		expect(assetScaleFor(100)).toBe(1);
		expect(assetScaleFor(101)).toBe(2);
		expect(assetScaleFor(200)).toBe(2);
		expect(assetScaleFor(201)).toBe(3);
		expect(assetScaleFor(300)).toBe(3);
	});

	test("emotescale counts toward the resolution too", () => {
		// a default-size overlay stays on 1x art until emotes grow
		expect(assetScaleFor(100, 1)).toBe(1);
		expect(assetScaleFor(100, 1.5)).toBe(2);
		expect(assetScaleFor(100, 2)).toBe(2);
		expect(assetScaleFor(100, 2.5)).toBe(3);
		// and the two factors multiply rather than either one winning
		expect(assetScaleFor(150, 2)).toBe(3);
		expect(assetScaleFor(200, 1)).toBe(2);
	});
});

describe("overlayParamsSchema invalid-value fallbacks", () => {
	test("a bad theme falls back to the default", () => {
		expect(overlayParamsSchema.parse({ theme: "not-a-theme" }).theme).toBe(
			OVERLAY_DEFAULTS.theme,
		);
	});

	test("bad layout and align values fall back to their defaults", () => {
		const parsed = overlayParamsSchema.parse({
			layout: "sideways",
			align: "center",
			group: "maybe",
		});
		expect(parsed.layout).toBe(OVERLAY_DEFAULTS.layout);
		expect(parsed.align).toBe(OVERLAY_DEFAULTS.align);
		expect(parsed.group).toBe(OVERLAY_DEFAULTS.group);
	});

	test("scroll and scrollspeed clamp instead of erroring", () => {
		expect(overlayParamsSchema.parse({ scroll: "ticker" }).scroll).toBe(
			"ticker",
		);
		expect(overlayParamsSchema.parse({ scroll: "marquee" }).scroll).toBe(
			OVERLAY_DEFAULTS.scroll,
		);
		expect(overlayParamsSchema.parse({ scrollspeed: 5 }).scrollspeed).toBe(5);
		// out of range and non-integer both fall back rather than snapping
		expect(overlayParamsSchema.parse({ scrollspeed: 9 }).scrollspeed).toBe(
			OVERLAY_DEFAULTS.scrollspeed,
		);
		expect(overlayParamsSchema.parse({ scrollspeed: 0 }).scrollspeed).toBe(
			OVERLAY_DEFAULTS.scrollspeed,
		);
		expect(overlayParamsSchema.parse({ scrollspeed: 2.5 }).scrollspeed).toBe(
			OVERLAY_DEFAULTS.scrollspeed,
		);
		expect(overlayParamsSchema.parse({ scrollspeed: true }).scrollspeed).toBe(
			OVERLAY_DEFAULTS.scrollspeed,
		);
	});

	test("a variant outside its theme's list falls back to the default", () => {
		expect(
			overlayParamsSchema.parse({ theme: "neon", variant: "notreal" }).variant,
		).toBe(OVERLAY_DEFAULTS.variant);
		expect(overlayParamsSchema.parse({ variant: "frost" }).variant).toBe(
			OVERLAY_DEFAULTS.variant,
		);
	});

	test("out-of-range scalars clamp to their fallbacks", () => {
		const parsed = overlayParamsSchema.parse({
			max: 9999,
			delay: -5,
			fade: 100000,
		});
		expect(parsed.max).toBe(OVERLAY_DEFAULTS.max);
		expect(parsed.delay).toBe(OVERLAY_DEFAULTS.delay);
		expect(parsed.fade).toBe(OVERLAY_DEFAULTS.fade);
	});

	test("?max=true does not coerce to 1", () => {
		expect(overlayParamsSchema.parse({ max: true }).max).toBe(
			OVERLAY_DEFAULTS.max,
		);
	});

	test("emotescale keeps half steps and snaps anything between", () => {
		expect(overlayParamsSchema.parse({ emotescale: 2.5 }).emotescale).toBe(2.5);
		expect(overlayParamsSchema.parse({ emotescale: 2.3 }).emotescale).toBe(2.5);
		expect(overlayParamsSchema.parse({ emotescale: 1.2 }).emotescale).toBe(1);
	});

	test("an out-of-range or non-numeric emotescale falls back to 1", () => {
		for (const raw of [0, 9, -2, true, "big"]) {
			expect(overlayParamsSchema.parse({ emotescale: raw }).emotescale).toBe(
				OVERLAY_DEFAULTS.emotescale,
			);
		}
	});

	test("refresh below the 5-minute floor is bumped to 5", () => {
		expect(overlayParamsSchema.parse({ refresh: 3 }).refresh).toBe(5);
		expect(overlayParamsSchema.parse({ refresh: 0 }).refresh).toBe(0);
		expect(overlayParamsSchema.parse({ refresh: 720 }).refresh).toBe(720);
	});

	test("media accepts static and safely falls back to animated", () => {
		expect(overlayParamsSchema.parse({ media: "static" }).media).toBe("static");
		expect(overlayParamsSchema.parse({ media: "invalid" }).media).toBe(
			OVERLAY_DEFAULTS.media,
		);
	});

	test("an invalid channel is dropped rather than erroring", () => {
		expect(overlayParamsSchema.parse({ channel: "bad name" }).channel).toBe(
			undefined,
		);
		expect(overlayParamsSchema.parse({ channel: "XQC" }).channel).toBe("xqc");
		// TanStack Router JSON-types a numeric channel; it stays a valid login
		expect(overlayParamsSchema.parse({ channel: 123456 }).channel).toBe(
			"123456",
		);
	});

	test("an empty object yields every default", () => {
		const parsed = overlayParamsSchema.parse({});
		expect(parsed.theme).toBe(OVERLAY_DEFAULTS.theme);
		expect(parsed.badges).toBe(true);
		expect(parsed.refresh).toBe(0);
		expect(parsed.media).toBe("animated");
		expect(parsed.events).toEqual([]);
	});
});
