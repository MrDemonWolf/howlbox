// Scheduling math for ?scroll=ticker. Kept pure and dependency-free so
// the lane behaviour is unit-checkable without a DOM: the renderer only
// measures two widths and writes the returned animation shorthand.
//
// Every message travels at the same speed, so its duration depends on
// its own width, and a shared "the lane is free again at" cursor keeps
// the next message off the back of the one ahead of it. The whole
// schedule rides animation-delay rather than a timer, because OBS
// throttles JS timers while a source is hidden and CSS animation clocks
// keep running.

// Speed at ?scrollspeed=1. Deliberately a crawl: a 1920px source takes
// about 45s to cross, which is slow enough to read a long message end to
// end. 1x is the floor and ?scrollspeed climbs from there, so anyone who
// wants a news ticker asks for one.
export const TICKER_BASE_PX_PER_SEC = 50;
// Clear space between one message and the next, in px at 1x.
export const TICKER_GAP_PX = 48;
// A lane holds roughly 0.12 messages/sec at 1x and 0.6 at 5x, while a
// busy channel sends 10-40. Without a ceiling the cursor runs minutes
// into the future, every message is evicted by ?max long before its
// delay elapses, and the lane goes permanently blank. Anything that
// cannot start within this window is never scheduled at all, so what
// shows is a sample of recent chat instead of a stalled queue.
export const TICKER_HORIZON_MS = 6000;

export interface TickerRun {
	durationMs: number;
	delayMs: number;
	nextFreeAt: number;
}

export interface TickerInput {
	// clock reading that animation-delay will be measured from
	now: number;
	// when the lane is clear again, from the previous run
	freeAt: number;
	ownWidth: number;
	containerWidth: number;
	pxPerSec: number;
}

// null means "do not animate this row": it parks off the clip edge and
// the ?max eviction reaps it. That is the only drop path, on purpose.
export function planTickerRun({
	now,
	freeAt,
	ownWidth,
	containerWidth,
	pxPerSec,
}: TickerInput): TickerRun | null {
	if (!(pxPerSec > 0) || !(containerWidth > 0) || !(ownWidth > 0)) {
		return null;
	}
	const startAt = Math.max(now, freeAt);
	const delayMs = startAt - now;
	if (delayMs > TICKER_HORIZON_MS) {
		return null;
	}
	return {
		durationMs: Math.round(((containerWidth + ownWidth) / pxPerSec) * 1000),
		delayMs: Math.round(delayMs),
		nextFreeAt: startAt + ((ownWidth + TICKER_GAP_PX) / pxPerSec) * 1000,
	};
}

export function tickerPxPerSec(scrollSpeed: number): number {
	return TICKER_BASE_PX_PER_SEC * scrollSpeed;
}
