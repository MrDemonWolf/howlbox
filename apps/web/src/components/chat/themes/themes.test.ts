import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { THEME_VARIANTS, THEMES } from "../../../lib/overlay/config";

// The Record<Theme, ...> maps catch a missing label or swatch at compile
// time, but nothing in the type system sees CSS. This test is the CSS
// side of that guard: every theme enum value must have a chunk file with
// the variable contract the renderer consumes, and the structural rules
// the cascade depends on must sit where the cascade needs them.

const chunkThemes = THEMES.filter((theme) => theme !== "wolf");

// Colon-suffixed so --hb-shadow: cannot match --hb-shadow-off: or a
// var(--hb-shadow) consumer.
const REQUIRED_DECLARATIONS = [
	"--hb-surface:",
	"--hb-surface-solid:",
	"--hb-border:",
	"--hb-shadow:",
	"--hb-text:",
	"--hb-shadow-off:",
	"--hb-event-accent:",
];

const REDUCED_TRANSPARENCY = "@media (prefers-reduced-transparency: reduce)";

function chunkCss(theme: string): string {
	return readFileSync(join(import.meta.dir, `${theme}.css`), "utf8");
}

describe("theme css chunks", () => {
	for (const theme of chunkThemes) {
		test(`${theme} declares the required variable contract`, () => {
			const css = chunkCss(theme);
			expect(css).toContain(`.hb-root[data-theme="${theme}"] {`);
			for (const declaration of REQUIRED_DECLARATIONS) {
				expect(css).toContain(declaration);
			}
		});

		test(`${theme} has a block for every declared variant`, () => {
			const css = chunkCss(theme);
			for (const variant of THEME_VARIANTS[theme]) {
				expect(css).toContain(
					`.hb-root[data-theme="${theme}"][data-variant="${variant}"] {`,
				);
			}
		});

		test(`${theme} ends with its reduced-transparency override`, () => {
			const css = chunkCss(theme);
			const mediaIndex = css.indexOf(REDUCED_TRANSPARENCY);
			expect(mediaIndex).toBeGreaterThan(-1);
			// Both arms: the bare theme selector ties the theme block, the
			// [data-variant] arm ties any variant block. Order inside the
			// file is what makes them win, so the media block must come
			// after every theme and variant block.
			const overrideCss = css.slice(mediaIndex);
			expect(overrideCss).toContain(`.hb-root[data-theme="${theme}"],`);
			expect(overrideCss).toContain(
				`.hb-root[data-theme="${theme}"][data-variant] {`,
			);
			const lastVariantBlock = css.lastIndexOf('[data-variant="');
			if (lastVariantBlock !== -1) {
				expect(mediaIndex).toBeGreaterThan(lastVariantBlock);
			}
		});
	}

	test("the site aggregate imports every chunk", () => {
		const css = readFileSync(join(import.meta.dir, "index.css"), "utf8");
		for (const theme of chunkThemes) {
			expect(css).toContain(`@import "./${theme}.css";`);
		}
	});

	test("base overlay.css holds no theme blocks", () => {
		const css = readFileSync(
			join(import.meta.dir, "..", "overlay.css"),
			"utf8",
		);
		expect(css).not.toContain('[data-theme="');
	});
});
