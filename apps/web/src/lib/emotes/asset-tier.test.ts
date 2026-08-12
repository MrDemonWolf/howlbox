import { describe, expect, test } from "bun:test";

import { assetTier, tierVariants } from "./asset-tier";

describe("assetTier", () => {
	test("the stock overlay stays on the 2x assets", () => {
		expect(assetTier()).toBe("standard");
		expect(assetTier(100, 1)).toBe("standard");
	});

	test("landing exactly on 2x does not upgrade", () => {
		// the 2x asset is still pixel-exact here, so ?size=200 on its own
		// must not start paying for the bigger download
		expect(assetTier(200, 1)).toBe("standard");
		expect(assetTier(100, 2)).toBe("standard");
		expect(assetTier(133, 1.5)).toBe("standard");
	});

	test("past 2x, from either factor or the two multiplied", () => {
		expect(assetTier(100, 2.5)).toBe("high");
		expect(assetTier(300, 1)).toBe("high");
		expect(assetTier(150, 2)).toBe("high");
	});
});

describe("tierVariants", () => {
	// This is the no-regression guard: these five strings are what the
	// overlay requested before ?emotescale existed, so a sub-2x setup
	// must keep fetching byte-identical art.
	test("standard is the pre-emotescale variant set", () => {
		expect(tierVariants("standard")).toEqual({
			sevenTv: "2x.webp",
			bttv: "2x.webp",
			ffz: "2",
			twitch: "2.0",
			cheer: "2",
		});
	});

	test("high is each provider's largest published variant", () => {
		expect(tierVariants("high")).toEqual({
			sevenTv: "4x.webp",
			bttv: "3x.webp",
			ffz: "4",
			twitch: "3.0",
			cheer: "4",
		});
	});
});
