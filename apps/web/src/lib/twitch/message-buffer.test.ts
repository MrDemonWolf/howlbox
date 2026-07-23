import { describe, expect, test } from "bun:test";

import type { ChatMessageView } from "@/lib/twitch/types";

import {
	appendCapped,
	PendingBuffer,
	passesFilters,
	removeById,
	removeByLogin,
} from "./message-buffer";

// Minimal ChatMessageView fixtures: the buffer only reads id/login/parts
// and the optional event, so the rest is filled loosely.
function msg(
	id: string,
	login: string,
	text = "hello",
	event?: ChatMessageView["event"],
): ChatMessageView {
	return {
		id,
		login,
		parts: [{ type: "text", text }],
		event,
	} as unknown as ChatMessageView;
}

const opts = (over: Partial<Parameters<typeof passesFilters>[1]> = {}) => ({
	hidden: new Set<string>(),
	allowed: new Set<string>(),
	hideCommands: false,
	...over,
});

describe("passesFilters", () => {
	test("drops hidden logins", () => {
		expect(
			passesFilters(
				msg("1", "nightbot"),
				opts({ hidden: new Set(["nightbot"]) }),
			),
		).toBe(false);
	});

	test("featured mode shows only allowed logins", () => {
		const allowed = new Set(["star"]);
		expect(passesFilters(msg("1", "star"), opts({ allowed }))).toBe(true);
		expect(passesFilters(msg("2", "rando"), opts({ allowed }))).toBe(false);
	});

	test("hideCommands drops a leading-! message", () => {
		expect(
			passesFilters(msg("1", "u", "!drop"), opts({ hideCommands: true })),
		).toBe(false);
		expect(
			passesFilters(msg("2", "u", "hi there"), opts({ hideCommands: true })),
		).toBe(true);
	});

	test("a standalone event row is never treated as a command", () => {
		const raid = msg("1", "raider", "!ignored", {
			kind: "raid",
		} as ChatMessageView["event"]);
		expect(passesFilters(raid, opts({ hideCommands: true }))).toBe(true);
	});
});

describe("visible-list ops", () => {
	test("appendCapped dedupes by id and caps length", () => {
		let list: ChatMessageView[] = [];
		list = appendCapped(list, msg("1", "a"), 2);
		list = appendCapped(list, msg("1", "a"), 2); // duplicate id, ignored
		expect(list.length).toBe(1);
		list = appendCapped(list, msg("2", "b"), 2);
		list = appendCapped(list, msg("3", "c"), 2); // over cap, oldest drops
		expect(list.map((m) => m.id)).toEqual(["2", "3"]);
	});

	test("removeById and removeByLogin drop the right rows", () => {
		const list = [msg("1", "a"), msg("2", "b"), msg("3", "a")];
		expect(removeById(list, "2").map((m) => m.id)).toEqual(["1", "3"]);
		expect(removeByLogin(list, "a").map((m) => m.id)).toEqual(["2"]);
	});
});

describe("PendingBuffer", () => {
	const entry = (id: string, login: string) => ({
		message: msg(id, login),
		timer: 0 as unknown as ReturnType<typeof setTimeout>,
	});

	test("take promotes and removes an entry", () => {
		const buf = new PendingBuffer<ReturnType<typeof entry>>(10);
		buf.add("1", entry("1", "a"));
		expect(buf.take("1")?.message.id).toBe("1");
		expect(buf.take("1")).toBeNull();
		expect(buf.size).toBe(0);
	});

	test("add evicts the oldest entry when full", () => {
		const buf = new PendingBuffer<ReturnType<typeof entry>>(2);
		expect(buf.add("1", entry("1", "a"))).toBeNull();
		expect(buf.add("2", entry("2", "b"))).toBeNull();
		const evicted = buf.add("3", entry("3", "c"));
		expect(evicted?.message.id).toBe("1");
		expect(buf.size).toBe(2);
	});

	test("drop by id and by login (a delete, a timeout or ban)", () => {
		const buf = new PendingBuffer<ReturnType<typeof entry>>(10);
		buf.add("1", entry("1", "a"));
		buf.add("2", entry("2", "spammer"));
		buf.add("3", entry("3", "spammer"));
		expect(buf.drop((m) => m.id === "1").map((e) => e.message.id)).toEqual([
			"1",
		]);
		expect(buf.drop((m) => m.login === "spammer").length).toBe(2);
		expect(buf.size).toBe(0);
	});

	test("clear returns every entry", () => {
		const buf = new PendingBuffer<ReturnType<typeof entry>>(10);
		buf.add("1", entry("1", "a"));
		buf.add("2", entry("2", "b"));
		expect(buf.clear().length).toBe(2);
		expect(buf.size).toBe(0);
	});
});
