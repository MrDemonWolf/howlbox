import { describe, expect, test } from "bun:test";

import { missedDemoRows } from "./demo-messages";

describe("missedDemoRows", () => {
	test("owes nothing before a full interval has passed", () => {
		expect(missedDemoRows(0, 1700, 17)).toBe(0);
		expect(missedDemoRows(1699, 1700, 17)).toBe(0);
	});

	test("owes one row per elapsed interval", () => {
		expect(missedDemoRows(1700, 1700, 17)).toBe(1);
		expect(missedDemoRows(5200, 1700, 17)).toBe(3);
	});

	test("a long hide refills at most one column", () => {
		// a source hidden for ten minutes must not replay 350 rows
		expect(missedDemoRows(600_000, 1700, 17)).toBe(17);
		expect(missedDemoRows(600_000, 1700, 5)).toBe(5);
	});

	test("bad clocks and empty scripts owe nothing", () => {
		expect(missedDemoRows(-5000, 1700, 17)).toBe(0);
		expect(missedDemoRows(Number.NaN, 1700, 17)).toBe(0);
		expect(missedDemoRows(5000, 0, 17)).toBe(0);
		expect(missedDemoRows(5000, 1700, 0)).toBe(0);
	});
});
