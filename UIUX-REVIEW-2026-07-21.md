# UI/UX Review: HowlBox site (landing, configurator, legal)

**Reviewed:** 2026-07-21 · **Input:** live URL (http://localhost:61449) + source code · **Method:** NN/g heuristic evaluation + guideline review

Scope: `/` landing, `/config` configurator, `/privacy` and `/terms` legal pages, in light and dark mode, at 1440x900 and 375x812. The `/overlay` OBS route is out of scope (it is a browser source, not a UI a person browses).

All colors were measured from computed styles with an sRGB contrast calculator that composites translucent layers and converts `oklab()`/`oklch()` (Tailwind 4 emits those for `/opacity` and `color-mix` utilities, and a naive parser silently reads them as black; the first pass of this review produced false failures for exactly that reason).

## Executive summary

- The redesign is in good shape on the things that usually fail. **Text contrast passes WCAG AA everywhere, in both modes, on both pages measured — zero failures.** Every form control has a real label, every image has alt text, landmarks and heading order are clean on the landing page.
- **The single worst problem is non-text contrast on controls.** Every secondary and segmented button is transparent with a 1px hairline border as its only affordance, and that hairline measures **1.2:1 in dark and 1.37:1 in light** against its background. WCAG 1.4.11 requires 3:1. This covers Load, Copy URL, Open preview, the S/M/L size presets, the display-mode picker, and all fifteen theme buttons — the primary controls of the configurator.
- Second: the configurator's section headings are `<h2>` rendered at **11.2px**, while a sibling `<h2>` on the same page renders at **48px** and its own child `<h3>`s render at **18px**. Visual weight runs backwards against document structure.
- Findings are concentrated in the configurator. The landing page has no severity 3+ findings of its own.

**Findings:** 🟥 0 catastrophic · 🟧 3 major · 🟨 9 minor · ⬜ 3 cosmetic

## Findings

### 🟧 Severity 3 — Major

#### 1. Secondary and segmented buttons have no visible boundary (1.2:1 border)

- **What:** `.hb-btn-secondary` and the segmented pickers use `background-color: transparent` with `border: 1px solid var(--site-line)`. Measured border-vs-background contrast: **1.20:1 in dark mode, 1.37:1 in light mode**. WCAG 1.4.11 Non-text Contrast requires 3:1 for the visual boundary of a user-interface component. Because the fill is transparent, that hairline is the entire clickability signifier. The selected state is fine (brand border, 7.04:1) — it is the *unselected* controls that disappear.
- **Where:** `/config` — Load button, Copy URL, Open preview, size presets S/M/L, display-mode picker (Transparent / Panel / Bubbles), all 15 theme buttons. Also `/` — the Star on GitHub CTA. Rule in `apps/web/src/index.css` (`.hb-btn-secondary`), token `--site-line`.
- **Guideline:** Clickability signifiers — interactive elements must retain enough visual cues (border, color, contrast) to be recognized as interactive; flat design does not exempt them.
- **Evidence:** [Beyond Blue Links: Making Clickable Elements Recognizable](https://www.nngroup.com/articles/clickable-elements/) — NN/g find that flat interfaces that strip borders and contrast leave users unable to tell what is clickable. Also WCAG 2.2 SC **1.4.11 Non-text Contrast** (AA, 3:1 for UI component boundaries).
- **Fix:**
  - [ ] Introduce a `--site-line-strong` token used only for control borders, set to at least 3:1 against `--site-surface` and `--site-elev` in both modes (dark: around `#4a5468`; light: around `#8d95a1`). Verify with the composite contrast script, not by eye.
  - [ ] Point `.hb-btn-secondary`, `.hb-btn-selected`'s unselected siblings, and the theme buttons at `--site-line-strong`. Leave `.hb-card` on the softer `--site-line`; a card is decoration, not a control.
  - [ ] Alternatively give secondary buttons a faint fill (`--site-surface` on an `--site-elev` card) so the shape reads without depending on a hairline at all.

#### 2. Configurator section headings are 11.2px `<h2>`, smaller than their own `<h3>` children

- **What:** Measured on `/config`: `h1` 60px; `h2` "Start from an existing link", "Channel", "Look", "Messages", "Moderation", "Advanced" all **11.2px** uppercase with 0.22em tracking; `h2` "Into OBS in four steps" **48px**; `h3` "Build your URL" and siblings **18px**. Two different `<h2>` treatments differ by 4.3x, and six `<h2>`s render smaller than every `<h3>` on the page. The markup outline is correct; the visual hierarchy contradicts it.
- **Where:** `/config` — `Fieldset` component in `apps/web/src/components/landing/config-builder.tsx` (the `text-[0.7rem] ... ${MONO}` heading), against `OBSSteps` in `apps/web/src/components/landing/site-chrome.tsx`.
- **Guideline:** Visual hierarchy — size and weight must communicate relative importance, and headings must look more important than the text they introduce.
- **Evidence:** [Visual Hierarchy in UX: Definition](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) — hierarchy is built from deliberate variation in scale and contrast so the eye reaches the most important elements first. See also [F-Shaped Pattern of Reading](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/), where NN/g state headings must be more visible than normal text or scanning users skip them.
- **Fix:**
  - [ ] Raise the fieldset heading from `0.7rem` (11.2px) to at least 15px, drop the uppercase + 0.22em tracking treatment, and give it `font-weight: 600`.
  - [ ] If the mono machine-voice look is wanted here, move it to a small kicker line *above* a normally-sized heading rather than applying it to the heading itself.
  - [ ] Decide one display scale for `<h2>` across the site and apply it in `.hb-display`; the configurator's own section heads and `OBSSteps` should not differ by 4x at the same level.

#### 3. Field hints and syntax examples are invisible to screen readers

- **What:** `/config` has 17 form controls. **0 of them carry `aria-describedby`.** Every hint — "Off, or every 5 to 60 minutes", "One or more set=url pairs, comma separated", "Just the login name, no URL or @" — is rendered as a sibling `<p>` with no programmatic association, so it is not announced when the field receives focus. Compounding this, the only place the `badgeart` syntax appears is the placeholder (`moderator=https://example.com/mod.png`), which vanishes the moment the user types.
- **Where:** `/config` — the `Field` component in `apps/web/src/components/landing/config-builder.tsx`; affects all `hint` props and every `placeholder`.
- **Guideline:** Instructions must be programmatically associated with the control they describe; placeholder text is not a substitute for a persistent hint.
- **Evidence:** [Placeholders in Form Fields Are Harmful](https://www.nngroup.com/articles/form-design-placeholders/) — placeholder text disappears on focus, so users cannot check what the field wanted while filling or proofreading it, and it disproportionately burdens users with cognitive and visual impairments. Also [Website Forms Usability: Top 10 Recommendations](https://www.nngroup.com/articles/web-form-design/) and WCAG 2.2 SC **3.3.2 Labels or Instructions** (A).
- **Fix:**
  - [ ] In `Field`, give the hint element an id derived from `htmlFor` (`${htmlFor}-hint`) and pass `aria-describedby` to the input.
  - [ ] Move the `badgeart` and `badgegist` syntax examples out of the placeholder and into the persistent hint text, so the format survives focus.
  - [ ] Keep placeholders only where they show a format that is also stated in the hint.

### 🟨 Severity 2 — Minor

#### 4. Body copy at 14px across most of the landing page

- **What:** 56 text elements render below 16px. The audience cards, the three supporting feature blocks, the display-mode captions, the setup-step bodies, and the footer all render body copy at **14px / 22.75px line-height**. Line lengths are healthy (measured 44 to 66 characters), so the density problem is size alone.
- **Where:** `/` — `AUDIENCES`, `SUPPORT`, `MODES`, `OBSSteps`, footer (`text-sm` utilities).
- **Guideline:** Use a reasonably large default text size; small type is the most common legibility complaint NN/g record.
- **Evidence:** [Legibility, Readability, and Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/) — NN/g recommend a reasonably large default font size and letting users adjust it. (The article states no specific pixel figure, so the 16px web default is cited here as convention plus WCAG 2.2 SC **1.4.4 Resize Text**, not as an NN/g number.)
- **Fix:**
  - [ ] Promote card and step body copy from `text-sm` (14px) to `text-base` (16px); the grid has room at every breakpoint.
  - [ ] Leave genuinely secondary text (footer legal line, disclaimer) at 14px.

#### 5. Header and footer navigation targets are 20px tall

- **What:** Header nav links measure 53x20, 39x20, 46x20; footer links 46x20 through 51x20. They are text-only with no vertical padding. **They do pass WCAG 2.2 SC 2.5.8** via the spacing exception — measured center-to-center distances are 56 to 80px, well clear of the 24px circle rule — but they fall well short of NN/g's recommended physical target.
- **Where:** `SiteHeader` and `SiteFooter` in `apps/web/src/components/landing/site-chrome.tsx`.
- **Guideline:** Touch targets should be about 1cm x 1cm physical, with spacing to prevent crowding errors.
- **Evidence:** [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/) — NN/g cite the Parhi/Karlson/Bederson finding for a 1cm minimum. WCAG SC **2.5.5 Target Size (Enhanced)** (AAA) sets 44x44.
- **Fix:**
  - [ ] Add `py-2.5` (or `min-h-11` with `inline-flex items-center`) to header and footer nav links so the hit area reaches 44px without changing the visual type size.

#### 6. Hero theme chips are 30px tall and there are fifteen of them

- **What:** The `DemoChat` theme picker renders 15 buttons at 30px height, 8px apart. Same verdict as finding 5: passes 2.5.8 (center distances exceed 24px in both axes), below the NN/g 1cm recommendation. Fifteen adjacent small targets is also the crowding case that research specifically warns about.
- **Where:** `/` hero — `apps/web/src/components/landing/demo-chat.tsx`.
- **Guideline / Evidence:** [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/).
- **Fix:**
  - [ ] Raise chip padding to reach 36px minimum height, or reduce the hero picker to a representative subset with a "see all fifteen" link to the theme wall.

#### 7. No skip link

- **What:** There is no skip-to-content link on any page. A keyboard or screen-reader user tabs through 5 header controls before reaching main content, on every page, every time.
- **Where:** `SiteShell` in `apps/web/src/components/landing/site-chrome.tsx`.
- **Guideline / Evidence:** WCAG 2.2 SC **2.4.1 Bypass Blocks** (A). NN/g's clickability and control guidance does not cover this specific pattern, so the citation is WCAG only.
- **Fix:**
  - [ ] Add a visually-hidden-until-focused `<a href="#main">Skip to content</a>` as the first child of `SiteShell`, and `id="main"` on the `<main>` element.

#### 8. Micro-labels at 11.2 to 12px with 0.22em uppercase tracking

- **What:** The `MONO` machine-voice treatment renders at 11.2 to 12px, uppercase, with 0.22em letter-spacing. It is used for the hero eyebrow, section kickers, "LIVE PREVIEW", "01 CONFIGURATOR", and "LAST UPDATED" on legal pages. Wide-tracked all-caps at that size is the hardest combination to read on screen, and it is currently carrying real information (the live-preview state readout, the last-updated date).
- **Where:** `MONO` constant in `apps/web/src/components/landing/site-chrome.tsx`; consumers across `/`, `/config`, `/privacy`, `/terms`.
- **Guideline:** Legibility falls with small sizes and all-caps settings; reserve decorative type treatments for text that carries no information.
- **Evidence:** [Legibility, Readability, and Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/).
- **Fix:**
  - [ ] Raise the `MONO` size floor to 12px and reduce tracking to 0.14em.
  - [ ] Move information-carrying uses (the preview state readout, "Last updated") out of the uppercase mono treatment and into normal sentence-case text.

#### 9. FAQ questions are not headings, and eight accordions hide content most readers want

- **What:** The FAQ renders eight `<details>` elements whose questions live in `<summary>`, not in a heading tag. They therefore do not appear in the document outline or in a screen reader's heading list, so the fastest way to scan a FAQ is unavailable. Separately, all eight are collapsed by default on a page where the answers are short and most visitors likely want several of them.
- **Where:** `/` FAQ section — `apps/web/src/routes/index.tsx`.
- **Guideline:** Accordions add interaction cost and hide content; when users need most sections, show them and let people scroll. Headings must reflect structure.
- **Evidence:** [Accordions Are Not Always the Answer for Complex Content on Desktops](https://www.nngroup.com/articles/accordions-complex-content/) — NN/g find that accordions shorten pages at the cost of interaction and hidden content. Also WCAG SC **2.4.6 Headings and Labels** (AA).
- **Fix:**
  - [ ] Wrap each `<summary>` content in an `<h3>` so the questions join the outline.
  - [ ] Consider expanding the two or three most-asked entries by default, or dropping the accordion on desktop entirely — the answers average under 60 words.

#### 10. The generated URL updates silently for screen-reader users

- **What:** The configurator's URL readout is a plain `<div class="break-all">` with no `aria-label` and no live region. Every control change rewrites it with no announcement. The only feedback on copy is a toast. Measured: exactly one `aria-live="polite"` region exists on the page, and it belongs to the toaster.
- **Where:** `/config` — the terminal-style readout in `apps/web/src/components/landing/config-builder.tsx`.
- **Guideline:** Keep users informed of system status through timely feedback in the same place the change happens.
- **Evidence:** [Visibility of System Status (Usability Heuristic #1)](https://www.nngroup.com/articles/visibility-system-status/); WCAG 2.2 SC **4.1.3 Status Messages** (AA).
- **Fix:**
  - [ ] Give the readout `role="status"` plus an `aria-label="Generated overlay URL"`, or render it as a read-only `<output>` element.
  - [ ] Debounce the announcement so dragging the size slider does not produce a stream of updates.

#### 11. Hairline card and band borders are near-invisible (1.32 to 1.37:1)

- **What:** `.hb-card` borders and the band separators measure **1.37:1 in light and 1.32:1 in dark** against their backgrounds. That is decorative, not a WCAG failure, but it means the alternating-band rhythm and card grouping rest on an edge many users will not perceive, and the whole page reads as one continuous surface at a glance — the same complaint the redesign set out to fix.
- **Where:** `--site-line` in `apps/web/src/index.css`; every `.hb-card` and `Band`.
- **Guideline:** Grouping should be perceivable; use proximity, contrast, and enclosure deliberately rather than relying on a single faint cue.
- **Evidence:** [Visual Hierarchy in UX: Definition](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/); [Low-Contrast Text Is Not the Answer](https://www.nngroup.com/articles/low-contrast/) for the general principle that washing out contrast is the wrong tool for hierarchy.
- **Fix:**
  - [ ] Widen the base/surface lightness gap by roughly one step so the bands separate on fill rather than on the border (light `--site-surface` toward `#eef1f6`; dark toward `#0d1424`).
  - [ ] Keep the hairline where it is; make the fill do the work.

#### 12. The numbered spine is inconsistent across pages

- **What:** The landing page numbers its sections 01 through 07, which reads as an index. `/config` shows a single "01 CONFIGURATOR" kicker and then an "02" on the OBS steps — a two-item index for a page that is not an index. The same visual component means "you are at step N of a sequence" in one place and nothing in another.
- **Where:** `Kicker` usage in `apps/web/src/routes/config.tsx` and `OBSSteps`.
- **Guideline:** Consistency and standards — the same element should mean the same thing everywhere.
- **Evidence:** [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/), heuristic 4.
- **Fix:**
  - [ ] Drop the number from the configurator kicker and use the plain `Eyebrow` there, reserving numbered kickers for the landing page's index.

### ⬜ Severity 1 — Cosmetic

#### 13. Display scale differs between pages

- **What:** `/config` `h1` is 60px; `/` `h1` is 48px at the same viewport. The secondary page shouts louder than the front door.
- **Fix:** [ ] Set both from one `.hb-display` scale; 48px on the landing, 40px on interior pages.

#### 14. The hero headline reads as one run-on string to screen readers

- **What:** The `h1` uses `<br>` between the three lines, so it is announced as "Your chat.Your colors.Your howl." with no pause between sentences.
- **Fix:** [ ] Replace the `<br>` elements with block-level `<span class="block">` children so each line is its own layout box and reads with natural separation.

#### 15. Theme-wall parameter codes are 12px

- **What:** The `?theme=wolf` labels on each theme tile render at 12px. They are the copy-and-paste payload of that whole section.
- **Fix:** [ ] Raise to 13 or 14px; they are the reason the tile exists.

## Unverified (needs a different input to check)

- **Hover and focus appearance in practice.** The `:focus-visible` rule exists and is correct (`2px solid var(--site-brand)` at 2px offset, and the brand color clears 3:1 against both backgrounds), but whether the ring is ever clipped by `overflow-hidden` ancestors — the theme tiles and the URL readout card both use it — needs manual keyboard tabbing on a real device.
- **Error recovery beyond the toast.** The only error path exercised was pasting a malformed URL. Network failure of the emote/badge fetches, and what the configurator preview shows when those fail, was not tested.
- **Real OBS rendering.** Everything here is a browser measurement; the overlay's behavior inside an OBS browser source (throttled timers, hidden-source reconnects) cannot be verified from this input.
- **Reduced-motion and reduced-transparency paths.** The CSS exists; the rendered result under those OS settings was not captured.
- **Whether the paste-to-load interaction is discoverable.** The hint says the URL loads on its own, but whether users notice the Load button is now optional needs observation, not inspection.

## What's working well

- **Text contrast passes AA everywhere measured, in both modes, with zero failures** — including the secondary text color, which is the usual casualty of a flat token system. Worst measured pair is 5.00:1 (button ink on brand fill, light mode).
- **Form labeling is complete.** 17 of 17 controls have a programmatic label; none rely on a placeholder for their name. Checkbox rows use a wrapping label, so the effective target is 44px tall even though the visual box is 20px.
- **Landing page heading structure is correct**: exactly one `h1`, no skipped levels, 22 headings across 8 sections, all descending in size with level.
- **Reset is undoable.** The destructive control offers an inline Undo action in its confirmation toast — a direct hit on NN/g's [User Control and Freedom](https://www.nngroup.com/articles/user-control-and-freedom/).
- **Theme choice respects the system setting by default** (`defaultTheme: system`) with an explicit override, which is what NN/g's [Dark Mode: How Users Think About It](https://www.nngroup.com/articles/dark-mode-users-issues/) recommends: users reason about dark mode at the OS level, not per app.
- **Paste-to-load removes a step** from the most common re-entry path without removing the button for people who type or edit the URL by hand.

## Quick wins

- [ ] Add `--site-line-strong` at 3:1 and point every control border at it (finding 1) — one token, one rule, fixes the worst finding on the site.
- [ ] Bump the configurator fieldset heading from 11.2px to 15px and drop the uppercase tracking (finding 2).
- [ ] Wire `aria-describedby` in the `Field` component (finding 3) — one component, covers all 17 controls.
- [ ] Add the skip link to `SiteShell` (finding 7) — four lines.
- [ ] Add `py-2.5` to header and footer nav links (finding 5).
- [ ] Wrap FAQ `<summary>` text in `<h3>` (finding 9).
