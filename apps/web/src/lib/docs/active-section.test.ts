import { expect, test } from "bun:test";

import { pickActiveSection } from "./active-section";

const LINE = { line: 120, atBottom: false };

// Real measurements taken from /docs at 1280x820, scrolled so that the
// "Theme values" section sat just under the header.
const REAL_TOPS = [
	{ id: "quick-start", top: -3809 },
	{ id: "channel", top: -3302 },
	{ id: "look", top: -2992 },
	{ id: "messages", top: -2298 },
	{ id: "moderation", top: -1282 },
	{ id: "advanced", top: -475 },
	{ id: "themes", top: 96 },
	{ id: "badge-art", top: 672 },
	{ id: "custom-css", top: 1543 },
	{ id: "troubleshooting", top: 2623 },
	{ id: "limits", top: 3876 },
];

test("picks the last section whose top has passed the header line", () => {
	expect(pickActiveSection(REAL_TOPS, LINE)).toBe("themes");
});

test("holds the first section while the page is still at the top", () => {
	const tops = [
		{ id: "quick-start", top: 200 },
		{ id: "channel", top: 700 },
	];
	expect(pickActiveSection(tops, LINE)).toBe("quick-start");
});

test("a section taller than the viewport stays active while it is read", () => {
	// "messages" starts above the line and the next one is far below, so
	// every scroll position inside it must keep reporting "messages"
	const tops = [
		{ id: "messages", top: -900 },
		{ id: "moderation", top: 1400 },
	];
	expect(pickActiveSection(tops, LINE)).toBe("messages");
});

test("selects a section sitting exactly on the line", () => {
	const tops = [
		{ id: "a", top: -10 },
		{ id: "b", top: 120 },
		{ id: "c", top: 400 },
	];
	expect(pickActiveSection(tops, LINE)).toBe("b");
});

test("the last section wins at the bottom of the page even if it never crossed the line", () => {
	// a short final section that stops 300px below the header
	const tops = [
		{ id: "troubleshooting", top: -800 },
		{ id: "limits", top: 300 },
	];
	expect(pickActiveSection(tops, { line: 120, atBottom: false })).toBe(
		"troubleshooting",
	);
	expect(pickActiveSection(tops, { line: 120, atBottom: true })).toBe("limits");
});

test("returns undefined when there is nothing to track", () => {
	expect(pickActiveSection([], LINE)).toBeUndefined();
});
