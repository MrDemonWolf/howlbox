/**
 * Which docs section the reader is currently in.
 *
 * Pure so it can be tested without a DOM: the caller measures, this
 * decides. Split out because the browser preview used for review could
 * not be made to emit scroll or IntersectionObserver events, so the only
 * honest way to prove the rule was to run it directly.
 *
 * The rule: the last section whose top has passed the header line. Not
 * "the first intersecting section", because sections here are taller
 * than the viewport and several intersect at once, and not "the closest
 * to the top", because that flickers between neighbours mid-scroll.
 */
export interface SectionTop {
	id: string;
	/** getBoundingClientRect().top, so viewport-relative and can be negative */
	top: number;
}

export function pickActiveSection(
	tops: SectionTop[],
	options: { line: number; atBottom: boolean },
): string | undefined {
	if (tops.length === 0) {
		return undefined;
	}
	// At the end of the document the final section may be too short to
	// ever cross the line, so nothing would select it.
	if (options.atBottom) {
		return tops[tops.length - 1].id;
	}
	let current = tops[0].id;
	for (const section of tops) {
		if (section.top <= options.line) {
			current = section.id;
		}
	}
	return current;
}
