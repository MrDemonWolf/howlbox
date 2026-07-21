# UI/UX Review: HowlBox, live site (second pass)

**Reviewed:** 2026-07-21 · **Input:** live URL (https://mrdemonwolf.github.io/howlbox/) · **Method:** NN/g heuristic evaluation + guideline review

Second pass, against the deployed site rather than a dev server. Covers `/`, `/docs/`, `/config/` in light and dark. The first pass (`UIUX-REVIEW-2026-07-21.md`) found 3 major, 9 minor, 3 cosmetic; the 3 major and 4 minor shipped. This pass verifies those held in production, reviews `/docs/` for the first time, and checks the rewritten copy.

Contrast is measured with a calculator that composites translucent ancestors and converts `oklab()`, which Tailwind 4 emits for `/opacity` utilities.

## Executive summary

- **Every fix from the first pass held in production.** Control borders measure 3.26:1 in light and 3.82:1 in dark against the 3:1 requirement, configurator section headings are 16px, hint text is wired to its controls, the skip link and `main` landmark exist, and all six FAQ questions are real `h3`s.
- **Text contrast passes AA everywhere measured** on `/`, `/docs/` and `/config/`, in both modes, with zero failures.
- **The worst remaining problem is on the new `/docs/` page: body text runs 101 characters per line** (806px column at 16px), well past the 50 to 75 range. That page's entire purpose is reading, and every paragraph is affected.
- The copy rewrite holds up against the scannability checks: paragraph length varies from 11 to 35 words, no vague link text, CTAs are action-specific, and the stated limitation sits at 615px on an 820px fold.
- Two findings are carried forward unfixed from the first pass by choice (14px body copy, the un-announced URL readout). They are restated here so the list is complete, not padded.

**Findings:** 🟥 0 catastrophic · 🟧 1 major · 🟨 7 minor · ⬜ 2 cosmetic

## Findings

### 🟧 Severity 3 — Major

#### 1. Documentation body text runs 101 characters per line

- **What:** On `/docs/` at 1280px, the prose column measures 806px wide at 16px, which works out to **101 characters per line** (measured, not estimated: `width / (fontSize × 0.5)`). The guideline range is 50 to 75. The column takes whatever the grid leaves after the 15rem table of contents, with no `max-width` of its own. Every paragraph on the page is affected, and the page is 9117px tall.
- **Where:** `/docs/` — the content column in `apps/web/src/routes/docs.tsx`, the `lg:grid-cols-[15rem_minmax(0,1fr)]` grid.
- **Guideline:** Long measures hurt reading. Users lose the start of the next line when the eye has to travel too far back, and this compounds over a long document.
- **Evidence:** [Legibility, Readability, and Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/) — NN/g treat line length as one of the levers that determines whether text is actually readable rather than merely legible. See also [How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/), where concise, scannable text measured 58% and 47% better on usability, and the two combined 124% better.
- **Why major:** reading is the sole task of this page, and every paragraph is affected. Same defect in a footer would be cosmetic.
- **Fix:**
  - [ ] Cap the docs content column at `max-w-[68ch]` (roughly 680px at 16px, landing near 68 characters).
  - [ ] Let the code blocks and the theme-value grid keep the full column width by opting them out, since those are scanned rather than read.

### 🟨 Severity 2 — Minor

#### 2. The docs table of contents never shows where you are

- **What:** `/docs/` has a sticky 11-item table of contents beside a 9117px page. **Zero** of its links carry `aria-current` or an active class at any scroll position, so there is no indication of which section you are in, in either the visual design or the accessibility tree.
- **Where:** `/docs/` — `nav[aria-label="On this page"]` in `apps/web/src/routes/docs.tsx`.
- **Guideline:** Visibility of system status. The system should keep users informed about where they are through timely feedback.
- **Evidence:** [Visibility of System Status (Usability Heuristic #1)](https://www.nngroup.com/articles/visibility-system-status/) — NN/g note that communicating location is one of the core jobs of this heuristic.
- **Fix:**
  - [ ] Add an `IntersectionObserver` that tracks which `section[id]` is in view and marks the matching link with `aria-current="location"` plus a brand-colored left border.
  - [ ] Keep it to one active item; highlighting several as they cross the viewport is noisier than highlighting none.

#### 3. The per-parameter anchors have no visible affordance

- **What:** `/docs/` has **18** `#param-<name>` anchors, added specifically so external writeups can deep-link one option. **0** of them expose a link control, so a reader who wants the URL for `refresh` has no way to get it short of reading the page source. The feature exists and is invisible.
- **Where:** `/docs/` — the `<dt>` blocks with `id="param-*"`.
- **Guideline:** Recognition rather than recall, and clickability signifiers: an available action needs a visible cue.
- **Evidence:** [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) (heuristic 6); [Beyond Blue Links: Making Clickable Elements Recognizable](https://www.nngroup.com/articles/clickable-elements/).
- **Fix:**
  - [ ] Wrap each parameter name in an `<a href="#param-name">` with a link glyph that appears on hover and focus, the pattern most documentation sites use.
  - [ ] Keep it keyboard reachable, not hover-only.

#### 4. Body copy still renders at 14px across the landing page

- **What:** Carried forward from the first pass, finding #4, not yet fixed. **36** text elements on `/` render below 16px, at 12px and 14px: the audience cards, the supporting feature trio, the mode captions, the setup steps, the footer.
- **Where:** `/` — `text-sm` utilities in `apps/web/src/routes/index.tsx` and `OBSSteps`.
- **Guideline:** Use a reasonably large default text size.
- **Evidence:** [Legibility, Readability, and Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/). The 16px figure is web convention plus WCAG 2.2 SC **1.4.4 Resize Text**, not an NN/g number; the article gives no pixel value.
- **Fix:**
  - [ ] Promote card and step body copy from `text-sm` to `text-base`.
  - [ ] Leave the footer disclaimer and legal line at 14px.

#### 5. The generated URL still updates silently for screen-reader users

- **What:** Carried forward from the first pass, finding #10, not yet fixed. Verified again on the live `/config/`: the URL readout is a plain `<div>` with `role=null`, `aria-label=null`, `aria-live=null`. The only live region on the page belongs to the toaster.
- **Where:** `/config/` — the readout in `apps/web/src/components/landing/config-builder.tsx`.
- **Guideline:** Keep users informed of system status where the change happens.
- **Evidence:** [Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/); WCAG 2.2 SC **4.1.3 Status Messages** (AA).
- **Fix:**
  - [ ] Give the readout `role="status"` and `aria-label="Generated overlay URL"`, or render it as `<output>`.
  - [ ] Debounce so dragging the size slider does not emit a stream of announcements.

#### 6. The home page announces "Themes" as the current page

- **What:** On `/`, the header link **"Themes" carries `aria-current="page"`**, because it is a hash link whose route target is `/` and the router matches on that. A screen-reader user on the home page is told they are on "Themes", and nothing identifies Home. On `/docs/` the same mechanism is correct ("Docs" is marked), so the bug is specific to hash links in the nav.
- **Where:** `SiteHeader` in `apps/web/src/components/landing/site-chrome.tsx` — the `Themes` link uses `to="/" hash="themes"`.
- **Guideline:** Consistency and standards, and correct exposure of state.
- **Evidence:** [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) (heuristic 4); WCAG 2.2 SC **4.1.2 Name, Role, Value** (A).
- **Fix:**
  - [ ] Pass `activeOptions={{ includeHash: true, exact: true }}` to the Themes link, or set `aria-current={undefined}` on hash links so only real route changes mark themselves.

#### 7. Header and footer navigation targets are 20px tall

- **What:** Carried forward, finding #5. Header nav links and footer links measure 20px tall on the live site. They **pass** WCAG 2.2 SC 2.5.8 through the spacing exception, since neighbouring centers sit 56 to 80px apart, but they fall short of the recommended physical target.
- **Where:** `SiteHeader` and `SiteFooter`.
- **Guideline / Evidence:** [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/) — roughly 1cm square, with spacing to avoid crowding. WCAG SC **2.5.5 Target Size (Enhanced)** (AAA) sets 44x44.
- **Fix:**
  - [ ] Add `py-2.5` so the hit area reaches 44px without changing the type size.

#### 8. Fifteen theme chips at 30px in the hero

- **What:** Carried forward, finding #6. The hero theme picker still renders 15 chips at 30px tall, 8px apart. Passes 2.5.8, below the NN/g recommendation, and 15 adjacent small targets is the crowding case the underlying research warns about.
- **Where:** `/` hero — `apps/web/src/components/landing/demo-chat.tsx`.
- **Guideline / Evidence:** [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/).
- **Fix:**
  - [ ] Raise chip padding to a 36px minimum height, or show a subset with a link to the theme wall.

### ⬜ Severity 1 — Cosmetic

#### 9. One FAQ heading does not front-load its information

- **What:** Of the eight `h2`s on `/`, seven carry their meaning in the first two words. "The things people ask first" starts with "The things", which conveys nothing to a scanning eye.
- **Guideline / Evidence:** [F-Shaped Pattern of Reading on the Web](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) — NN/g advise that if users see only the first two words of a heading, those should still give the gist.
- **Fix:** [ ] Retitle to "Questions people ask first" or simply "Common questions".

#### 10. Docs code blocks are full-width regardless of content

- **What:** All four `<pre>` blocks on `/docs/` stretch to the full 806px column even when the content is `/config`, which is 7 characters. They read as empty boxes.
- **Fix:** [ ] Let the `pre` shrink-wrap with `w-fit max-w-full`, keeping `overflow-x-auto` for the long URL.

## Unverified (needs a different input to check)

- **Mobile layout and touch targets at a real small viewport.** The browser pane's viewport emulation did not apply on this pass: `window.innerWidth` stayed at 808 to 809 while `clientWidth` followed the requested 375 or 390, so the page kept laying out at desktop width inside a narrow window. Measurements taken in that state would be fiction. The landing page was verified at a genuine 375px layout earlier in the day (the hero grid `min-w-0` fix), but `/docs/` has never been checked at a real mobile width, and its two-column grid plus 806px code blocks is exactly where a problem would hide. **Re-check `/docs/` on a physical phone or a working emulator before assuming it reflows.**
- **Keyboard focus appearance in practice.** The `:focus-visible` rule is present and correct (`2px solid var(--site-brand)`, 2px offset, and the brand color clears 3:1 on both backgrounds), but whether the ring is clipped by `overflow-hidden` ancestors on the theme tiles and the docs code blocks needs real tabbing.
- **Whether the docs page answers real questions.** Structure and readability are measurable; whether the troubleshooting section covers what people actually hit is not, without support traffic or user testing.
- **Reduced-motion and reduced-transparency rendering.** The CSS exists; the result under those OS settings was not captured.

## What's working well

- **Every first-pass fix survived deployment**, verified against production rather than a local build: control borders at 3.26:1 light and 3.82:1 dark, configurator headings at 16px, hints wired to controls, skip link, `main` landmark, six FAQ `h3`s.
- **Zero text contrast failures** across `/`, `/docs/` and `/config/` in both modes, including the secondary text color that usually breaks first in a flat token system.
- **Heading structure on `/docs/` is clean**: one `h1`, no skipped levels, sizes descending 48 / 24 / 18 in step with level, across 15 headings.
- **The copy rewrite measurably improved scannability**: paragraph length now varies 11 to 35 words rather than sitting uniform, no link text is vague, every CTA names its action ("Build your URL", "Read the parameter reference"), and the honest limitation lands at 615px against an 820px fold.

## Quick wins

- [ ] Cap the docs prose column at `max-w-[68ch]` (finding #1) — one class, fixes the only major finding.
- [ ] Fix the `aria-current` on the Themes nav link (finding #6) — one prop.
- [ ] Add `role="status"` and an `aria-label` to the URL readout (finding #5).
- [ ] Add `py-2.5` to header and footer nav links (finding #7).
- [ ] Retitle the FAQ heading (finding #9).
