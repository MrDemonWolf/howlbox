import { describe, expect, test } from "bun:test";

import type { MessagePart } from "@/lib/twitch/types";

import type { EmoteMap } from "./emotes";
import { groupParts, isEmoteOnly, splitTextPart } from "./resolve";

const emotes: EmoteMap = new Map([
	["Kappa", { url: "https://cdn/kappa.png", zeroWidth: false }],
	["Hands", { url: "https://cdn/hands.png", zeroWidth: false }],
	["RainTime", { url: "https://cdn/rain.png", zeroWidth: true }],
]);

describe("splitTextPart", () => {
	test("emits emote and text parts around whitespace", () => {
		expect(splitTextPart("hi Kappa there", emotes)).toEqual([
			{ type: "text", text: "hi " },
			{
				type: "emote",
				name: "Kappa",
				url: "https://cdn/kappa.png",
				zeroWidth: false,
			},
			{ type: "text", text: " there" },
		]);
	});

	test("plain text with no emote stays one text part", () => {
		expect(splitTextPart("just words", emotes)).toEqual([
			{ type: "text", text: "just words" },
		]);
	});
});

describe("isEmoteOnly", () => {
	const kappa: MessagePart = {
		type: "emote",
		name: "Kappa",
		url: "https://cdn/kappa.png",
	};

	test("a lone emote counts", () => {
		expect(isEmoteOnly([kappa])).toBe(true);
	});

	test("several emotes separated by whitespace count", () => {
		expect(isEmoteOnly([kappa, { type: "text", text: "  " }, kappa])).toBe(
			true,
		);
	});

	test("one word alongside the emote disqualifies the row", () => {
		expect(isEmoteOnly([{ type: "text", text: "lol " }, kappa])).toBe(false);
	});

	test("text alone and an empty body do not count", () => {
		expect(isEmoteOnly([{ type: "text", text: "hello" }])).toBe(false);
		expect(isEmoteOnly([])).toBe(false);
		// a raid row: no parts at all, just the event line
		expect(isEmoteOnly([{ type: "text", text: "" }])).toBe(false);
	});
});

describe("groupParts zero-width overlay grouping", () => {
	const emote = (name: string, zeroWidth: boolean): MessagePart => ({
		type: "emote",
		name,
		url: `https://cdn/${name}.png`,
		zeroWidth,
	});

	test("a zero-width emote stacks onto the preceding emote", () => {
		const groups = groupParts([emote("Hands", false), emote("RainTime", true)]);
		expect(groups.length).toBe(1);
		expect(groups[0]?.overlays.map((o) => o.name)).toEqual(["RainTime"]);
	});

	test("a leading zero-width emote falls through to a standalone render", () => {
		const groups = groupParts([emote("RainTime", true)]);
		expect(groups.length).toBe(1);
		expect(groups[0]?.overlays).toEqual([]);
	});

	test("token whitespace is consumed before a zero-width overlay", () => {
		const groups = groupParts(splitTextPart("Hands RainTime", emotes));
		expect(groups).toHaveLength(1);
		expect(groups[0]?.part).toMatchObject({ type: "emote", name: "Hands" });
		expect(groups[0]?.overlays.map((part) => part.name)).toEqual(["RainTime"]);
	});

	test("non-whitespace text between two emotes breaks the group", () => {
		const groups = groupParts([
			emote("Hands", false),
			{ type: "text", text: " words " },
			emote("RainTime", true),
		]);
		expect(groups.length).toBe(3);
	});
});
