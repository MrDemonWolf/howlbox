import { describe, expect, test } from "bun:test";

import {
	planTickerRun,
	TICKER_GAP_PX,
	TICKER_HORIZON_MS,
	tickerPxPerSec,
} from "./ticker";

const LANE = 1920;
const ROW = 480;
// 1x is a crawl, so one row holds the lane for longer than the horizon
// and the queueing cases have to run at a speed where a follower can
// actually be scheduled. The 1x behaviour gets its own test below.
const SPEED = tickerPxPerSec(5);

function plan(overrides: Partial<Parameters<typeof planTickerRun>[0]> = {}) {
	return planTickerRun({
		now: 1000,
		freeAt: 0,
		ownWidth: ROW,
		containerWidth: LANE,
		pxPerSec: SPEED,
		...overrides,
	});
}

describe("planTickerRun", () => {
	test("an empty lane starts immediately and crosses at the set speed", () => {
		const run = plan();
		expect(run).not.toBeNull();
		expect(run?.delayMs).toBe(0);
		// the message travels its own width plus the whole lane
		expect(run?.durationMs).toBe(Math.round(((LANE + ROW) / SPEED) * 1000));
	});

	test("the next message waits for the lane to clear", () => {
		const first = plan();
		expect(first).not.toBeNull();
		const second = plan({ freeAt: first?.nextFreeAt ?? 0 });
		expect(second?.delayMs).toBe(
			Math.round(((ROW + TICKER_GAP_PX) / SPEED) * 1000),
		);
	});

	test("the cursor only ever moves forward", () => {
		let freeAt = 0;
		let now = 0;
		for (let i = 0; i < 5; i += 1) {
			const run = plan({ now, freeAt });
			expect(run).not.toBeNull();
			const next = run?.nextFreeAt ?? 0;
			expect(next).toBeGreaterThan(freeAt);
			freeAt = next;
			// arrivals inside the horizon; a wider spread is the
			// backlog case below
			now += TICKER_HORIZON_MS;
		}
	});

	test("a backlog past the horizon is not scheduled at all", () => {
		expect(plan({ now: 0, freeAt: TICKER_HORIZON_MS })).not.toBeNull();
		expect(plan({ now: 0, freeAt: TICKER_HORIZON_MS + 1 })).toBeNull();
	});

	test("at 1x one row holds the lane for longer than the horizon", () => {
		// the crawl is slow on purpose, so back-to-back arrivals cannot
		// both run: the follower is dropped and the lane takes the next
		// message that turns up after the slot has drained
		const first = plan({ pxPerSec: tickerPxPerSec(1) });
		const slotMs = (first?.nextFreeAt ?? 0) - 0;
		expect(slotMs).toBeGreaterThan(TICKER_HORIZON_MS);
		expect(
			plan({ pxPerSec: tickerPxPerSec(1), freeAt: first?.nextFreeAt ?? 0 }),
		).toBeNull();
		expect(
			plan({
				pxPerSec: tickerPxPerSec(1),
				now: slotMs,
				freeAt: first?.nextFreeAt ?? 0,
			}),
		).not.toBeNull();
	});

	test("a faster speed shortens the crossing proportionally", () => {
		const slow = plan({ pxPerSec: tickerPxPerSec(1) });
		const fast = plan({ pxPerSec: tickerPxPerSec(5) });
		expect(slow?.durationMs).toBe((fast?.durationMs ?? 0) * 5);
	});

	test("an unmeasurable row or lane is skipped rather than flashed", () => {
		expect(plan({ containerWidth: 0 })).toBeNull();
		expect(plan({ ownWidth: 0 })).toBeNull();
		expect(plan({ ownWidth: -10 })).toBeNull();
		expect(plan({ pxPerSec: 0 })).toBeNull();
		expect(plan({ pxPerSec: Number.NaN })).toBeNull();
	});
});
