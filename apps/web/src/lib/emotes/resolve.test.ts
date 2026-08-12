import { describe, expect, test } from "bun:test";

import type { MessagePart } from "@/lib/twitch/types";

import type { EmoteMap } from "./emotes";
import {
	emoteOnlyCount,
	groupParts,
	isEmoteOnly,
	splitTextPart,
} from "./resolve";

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

	test("a bits-only cheer counts on its tier art alone", () => {
		// "Cheer100" with nothing else: stripCheermoteTokens empties the
		// body, so the cheermote is the whole message
		expect(isEmoteOnly([], true)).toBe(true);
		expect(isEmoteOnly([kappa], true)).toBe(true);
	});

	test("a cheer with words in it still stays at normal size", () => {
		expect(isEmoteOnly([{ type: "text", text: "nice stream" }], true)).toBe(
			false,
		);
	});
});

describe("emoteOnlyCount", () => {
	const emote = (name: string): MessagePart => ({
		type: "emote",
		name,
		url: `https://cdn/${name}.png`,
	});

	test("counts the art on an emote-only row", () => {
		expect(emoteOnlyCount([emote("a")])).toBe(1);
		expect(
			emoteOnlyCount([emote("a"), { type: "text", text: " " }, emote("b")]),
		).toBe(2);
		// the cheermote is art the parts list never carries
		expect(emoteOnlyCount([emote("a")], true)).toBe(2);
		expect(emoteOnlyCount([], true)).toBe(1);
	});

	test("is 0 for any row that is not emote-only", () => {
		expect(emoteOnlyCount([{ type: "text", text: "hi" }, emote("a")])).toBe(0);
		expect(emoteOnlyCount([])).toBe(0);
	});

	test("never returns 0 for a row isEmoteOnly accepts", () => {
		// the count divides the scale in chat-message.tsx, so a 0 here
		// would divide by zero on a row that is about to be scaled
		for (const parts of [[emote("a")], [emote("a"), emote("b")]]) {
			if (isEmoteOnly(parts)) {
				expect(emoteOnlyCount(parts)).toBeGreaterThan(0);
			}
		}
		expect(emoteOnlyCount([], true)).toBeGreaterThan(0);
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
