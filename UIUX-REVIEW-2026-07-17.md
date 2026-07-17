# UI/UX Review: HowlBox landing + configurator

**Reviewed:** 2026-07-17 · **Input:** local code (React/Tailwind) + live preview on port 3001 · **Method:** NN/g heuristic evaluation + guideline review

All findings below were fixed in this pass; each finding notes the fix that shipped.

## Executive summary

- The frontend was already in strong shape: Tailwind-first components, a real
  focus ring, reduced-motion and reduced-transparency support, honest
  transparency previews, and real product surfaces in the theme gallery.
- Zero severity 4 findings. The two severity 3 findings were interaction bugs,
  not visual ones: theme tiles that dropped the clicked theme, and number
  inputs that snapped to a fallback while the user was still typing.
- The rest was measurable polish: three text styles below AA contrast, nav
  text below the legibility floor, one heading-level skip, and a GPU-heavy
  blur layer that added nothing visually.

**Findings:** 🟥 0 catastrophic · 🟧 2 major · 🟨 4 minor · ⬜ 2 cosmetic

## Findings

### 🟧 Severity 3 — Major

#### 1. Theme-wall tiles did not carry the clicked theme into the configurator
- **What:** Every tile in the 13-theme gallery linked to `/config` with no
  parameters, so clicking "Synthwave Neon" landed on the default Wolf Glass
  config. The label promised a theme; the destination discarded it.
- **Where:** `apps/web/src/components/landing/theme-wall.tsx` (`ThemeTile`),
  `apps/web/src/routes/config.tsx`
- **Guideline:** Link labels must be fulfilled by the destination page.
- **Evidence:** [A Link is a Promise](https://www.nngroup.com/articles/link-promise/) — anchor text sets a strong expectation about the destination, and the destination should fulfill it.
- **Fix (shipped):**
  - [x] `/config` route now validates an optional `?theme=` search param (zod enum, falls back to none)
  - [x] `ThemeTile` links pass `search={{ theme }}`
  - [x] `ConfigBuilder` accepts `initialTheme` and seeds state with it
  - [x] Verified: `/config?theme=neon` opens with Synthwave Neon selected and serialized into the copied URL

#### 2. Number inputs snapped to a fallback while the field was being edited
- **What:** `Max messages` clamped on every keystroke with
  `Number(raw) || fallback`; clearing the field or backspacing through "50"
  instantly rewrote it to 50 (and "0" drafts to the min), so users could not
  type a replacement value normally.
- **Where:** `apps/web/src/components/landing/config-builder.tsx` (`cfg-max`, `cfg-fade`, `cfg-delay`)
- **Guideline:** Usability heuristic 3 — users must stay in control while editing; the system should not fight their in-progress input.
- **Evidence:** [User Control and Freedom (Usability Heuristic #3)](https://www.nngroup.com/articles/user-control-and-freedom/) — users often change their minds mid-action and need to do so without the system overriding them.
- **Fix (shipped):**
  - [x] New `NumberField` keeps a raw text draft while focused, commits clamped values as they land, re-syncs display on blur
  - [x] Verified in browser: clearing `cfg-max` stays empty, typing 120 commits `max=120` to the URL

### 🟨 Severity 2 — Minor

#### 3. Three text styles below WCAG AA contrast
- **What:** `text-white/35` over the `#040713` canvas computes to roughly
  3.2:1, below the 4.5:1 AA threshold for small text. Used on the theme-wall
  `?theme=` codes (12px) and the configurator's `Transparent / Wolf Glass`
  status readout (9.6px).
- **Where:** `theme-wall.tsx`, `config-builder.tsx`
- **Guideline:** Low-contrast text is illegible and inaccessible, whatever the aesthetic.
- **Evidence:** [Low-Contrast Text Is Not the Answer](https://www.nngroup.com/articles/low-contrast/) — low-contrast text may look clean but harms legibility and discoverability. Also WCAG 2.1 SC 1.4.3.
- **Fix (shipped):**
  - [x] Both bumped to `text-white/50` (roughly 5.4:1 over the canvas)

#### 4. Primary nav below the small-text legibility floor
- **What:** Header nav links were `text-[0.7rem]` (11.2px) uppercase mono with
  0.22em tracking - the site's primary navigation in the hardest-to-read
  treatment on the page.
- **Where:** `site-chrome.tsx` (`SiteHeader` nav)
- **Guideline:** Legibility degrades sharply for small, letterspaced, all-caps text; body-critical UI should not sit at the floor.
- **Evidence:** [Legibility, Readability, and Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/) — users will not read text that is not effortlessly legible.
- **Fix (shipped):**
  - [x] Nav bumped to `text-xs` (12px) and `text-white/60`; decorative mono kickers elsewhere intentionally keep the smaller scale

#### 5. Heading-level skip on the configurator page
- **What:** `/config` went h1 ("Configure your overlay") straight to h3
  (fieldset titles), skipping h2, which breaks the outline screen-reader users
  navigate by.
- **Where:** `config-builder.tsx` (`Fieldset`)
- **Guideline:** WCAG 1.3.1 (info and relationships); headings must descend without skips. (Accessibility criterion; no NN/g article cited.)
- **Fix (shipped):**
  - [x] `Fieldset` renders h2 with the same visual style

#### 6. Aurora layer paid for a 36px blur that changed nothing
- **What:** `.hb-aurora` was a fixed 150%-viewport layer with
  `filter: blur(36px)` animating forever. The radial gradients under it are
  already soft; an A/B in the live preview showed no visible difference with
  the blur removed, and giant filtered fixed layers are a known scroll-jank
  source on weak GPUs (the review browser's renderer stalled on this page).
- **Where:** `apps/web/src/index.css` (`hb-aurora`)
- **Guideline:** Animation must serve attention and comprehension, and never degrade interaction performance.
- **Evidence:** [Animation for Attention and Comprehension](https://www.nngroup.com/articles/animation-usability/) — weigh an animation's goal and mechanics against its cost.
- **Fix (shipped):**
  - [x] `filter: blur(36px)` removed; gradients carry the softness

### ⬜ Severity 1 — Cosmetic

#### 7. White flash on overscroll and route load
- **What:** The dark canvas was painted by a div; the html/body default stayed
  white, so macOS overscroll bounce and slow loads flashed white on a dark
  site.
- **Where:** `index.css`
- **Fix (shipped):** `html:not(.hb-overlay) { background-color: #040713 }` (the `:not` keeps the OBS overlay route transparent).

#### 8. 9.6px machine-voice labels
- **What:** `text-[0.6rem]` (9.6px) on the configurator status line and the
  terminal-chrome caption.
- **Fix (shipped):** Bumped to `text-[0.65rem]` (10.4px). Remaining sub-11px
  mono labels are decorative kickers duplicated by adjacent full-size text.

## Unverified (needs a different input to check)

- Real OBS rendering of the 13 themes over gameplay (contrast of `bg=off`
  shadow stacks) — needs an OBS capture, not a browser.
- Mobile nav collapses to Configure-only below `sm` — reviewed in code, not on
  a physical device; hash-anchored sections remain reachable by scrolling, so
  left as a deliberate trade-off.
- Screen-reader pass (VoiceOver) — heading fix is code-verified only.

## What's working well

- Global cerulean `:focus-visible` ring, correctly scoped away from the OBS
  overlay route.
- `prefers-reduced-motion` and `prefers-reduced-transparency` both honored,
  including inside the theme system.
- Honest transparency: the configurator previews on an OBS-style
  checkerboard, and the theme wall renders the real `MessageList` component,
  not screenshots.
- Error prevention on the primary action: Copy URL with an empty channel
  explains what to do instead of copying a broken URL.

## Quick wins

All shipped in this pass; nothing outstanding from this review.
