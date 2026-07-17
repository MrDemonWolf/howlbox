# UI/UX Review: HowlBox landing page (marketing pass)

**Reviewed:** 2026-07-17 · **Input:** local code (`apps/web/src/routes/index.tsx`, `apps/web/src/components/landing/*`) + live dev-server screenshots at 800px and full scroll · **Method:** NN/g heuristic evaluation + guideline review

## Executive summary

- Overall the page is visually strong and on-brand; the biggest problems are marketing gaps, not visual ones: the strongest facts (free, open source, no account) are rendered in the smallest, lowest-contrast type on the page.
- Worst single problem: a roughly full-viewport dead band between the hero demo and the features section on sub-1024px viewports creates a false floor where visitors may stop scrolling.
- Mobile navigation hides Themes, Setup, and GitHub entirely with no menu.
- No affiliation disclaimer anywhere; a Twitch tool without one is a trust and legal gap (fixed in this pass, matching the Wolfathon footer).
- Zero severity-4 findings.

**Findings:** 🟥 0 catastrophic · 🟧 2 major · 🟨 4 minor · ⬜ 2 cosmetic

## Findings

### 🟧 Severity 3 — Major

#### 1. False floor: near-empty screenful between hero and features (sub-lg viewports)
- **What:** At 800px wide, after the theme chips the page shows ~400px of empty background before the "Why it's different" kicker (hero `pb-28` = 112px, features `py-24` = 96px top, plus demo column slack). A visitor sees a full dark screen and can reasonably conclude the page is over.
- **Where:** `routes/index.tsx` hero section bottom padding + features section top padding, stacked-column breakpoints.
- **Guideline:** Scrolling behavior; users decide whether to keep scrolling from what they see near the fold, and an empty screenful reads as a page end (false floor).
- **Evidence:** [Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/) — even in 2018 eyetracking, attention concentrates above the fold and drops sharply when the next screenful looks contentless.
- **Fix:**
  - [ ] Reduce hero bottom padding on small screens (`pb-16 lg:pb-28`)
  - [ ] Pull the features section up (`pt-14 lg:pt-24`)
  - [ ] Add a compact facts band directly under the hero so the next section peeks above the fold

#### 2. Mobile navigation removes Themes, Setup, and GitHub with no fallback
- **What:** `[&>a:not(:last-child)]:max-sm:hidden` hides every nav link except Configure below 640px. There is no menu button; section discovery relies entirely on blind scrolling.
- **Where:** `site-chrome.tsx` `SiteHeader` nav.
- **Guideline:** Recognition rather than recall / discoverability; navigation options must stay visible rather than requiring users to remember or guess what exists.
- **Evidence:** [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) — heuristic 6: minimize memory load by keeping options visible.
- **Fix:**
  - [ ] Keep the links visible on small screens: drop the hide rule, shrink gaps, let the nav wrap

### 🟨 Severity 2 — Minor

#### 3. Strongest marketing facts are the smallest text on the page
- **What:** The trust row ("MIT licensed", "13 themes", "No server, no accounts") renders at `text-[0.68rem]` (10.9px) uppercase mono with 0.22em tracking in `text-white/55`. These are the three facts most likely to convert a self-hosting streamer, set in the least readable style on the page.
- **Where:** `routes/index.tsx` `TRUST` row.
- **Guideline:** Users scan for facts and distrust pages that bury them; low-contrast small text is both illegible and undiscoverable.
- **Evidence:** [How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/) — users scan for keywords and want straight facts; [Low-Contrast Text Is Not the Answer](https://www.nngroup.com/articles/low-contrast/) — low-contrast text degrades legibility and discoverability.
- **Fix:**
  - [ ] Promote the facts into a scannable stats band (large numeral + label per fact)
  - [ ] Raise remaining mono microcopy to at least 0.72rem / white-65

#### 4. Theme chip buttons are below minimum touch size
- **What:** Demo theme chips are `px-3 py-1 text-xs`: ~26px tall with 6px gaps, 13 adjacent targets. NN/g minimum is 1cm x 1cm (~38-44px CSS on typical phones) with adequate spacing.
- **Where:** `demo-chat.tsx` chip buttons.
- **Evidence:** [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/) — interactive elements must be at least 1cm x 1cm; crowding causes selection errors.
- **Fix:**
  - [ ] `py-1.5` minimum and `gap-2` between chips (still compact, materially larger targets)

#### 5. No affiliation disclaimer or legal trust signal
- **What:** The footer names MrDemonWolf, Inc. but never states that HowlBox is unaffiliated with Twitch or Amazon. For a tool whose entire purpose is Twitch chat, that is a credibility gap and a trademark-risk gap. Wolfathon already ships this pattern.
- **Where:** `site-chrome.tsx` `SiteFooter`.
- **Guideline:** Credibility determines whether users trust who is behind a page.
- **Evidence:** [How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/) — credibility is a first-class factor for web users because it is unclear who is behind information on the web.
- **Fix:**
  - [ ] Add the disclaimer line above the copyright row, mirroring Wolfathon's wording

#### 6. CTA band eyebrow "Ninety seconds" is a riddle, not a message
- **What:** The kicker "NINETY SECONDS" only makes sense after reading the body copy below it; scanners hit it first and get nothing.
- **Where:** `routes/index.tsx` CTA band.
- **Evidence:** [How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/) — subheadings must be meaningful, not clever, because scanners read them first.
- **Fix:**
  - [ ] Replace with a fact kicker ("Free and open source") and move the time claim into the heading

### ⬜ Severity 1 — Cosmetic

#### 7. "Star on GitHub" competes with the primary CTA
- Equal-size button beside "Build your overlay". Acceptable, but the page's one job is the configurator. Demoted visual weight would sharpen it.

#### 8. Feature-index hover affordance
- Feature rows highlight on hover (`hover:border-[#00ACED]/40`) but are not interactive; a hover effect on non-clickable rows suggests a link that is not there. Left as-is (subtle enough), noted for consistency.

## Reviewer judgment (no NN/g citation)

- **OG image does not show the product.** The current card is wordmark + paw. Social shares are the page's highest-reach marketing surface; a card that shows the actual overlay (chat bubbles over a game-like backdrop) communicates the product in one glance. Rebuilt in this pass.

## Unverified (needs a different input to check)

- Keyboard focus-visible styling across all landing controls: needs an interactive keyboard pass.
- `prefers-reduced-motion` handling for `hb-reveal` entrance animations: needs an OS-setting pass.

## What's working well

- The live `MessageList`-backed demo and theme wall are real surfaces, not mockups; that is rare, honest marketing.
- The "machine voice" mono system plus one URL narrative is a coherent, differentiated brand device.
- The hero already answers what/for-whom/how in one viewport on desktop.
- Body copy contrast (white/55 on #040713, ~5.6:1) passes WCAG AA for normal text.

## Quick wins

- [ ] Footer disclaimer (finding 5)
- [ ] Padding fix for the false floor (finding 1)
- [ ] Stats band promoting the trust facts (finding 3)
- [ ] Chip touch targets (finding 4)
- [ ] CTA kicker copy (finding 6)
