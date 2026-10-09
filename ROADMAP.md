# HowlBox product and quality roadmap

Updated: 2026-10-09

## Direction

Keep HowlBox a fast, client-only OBS chat overlay configured by one URL. Improve
the parts that help a streamer get from the landing page to a working source,
make the long parameter reference easier to scan, and fix overlay correctness
without changing its message contract, URL format, or public hb-* CSS hooks.

The current branch contains the overlay, docs, test, and custom-domain work.
It is isolated from the deployed `main`. The Pages custom domain and explicit
DNS record are configured; GitHub's HTTPS certificate is pending, so the
root-path build has not been deployed.

The configurator preview switches between seeded demo chat and a live Twitch
channel. Older GitHub Pages overlay links still import, then the builder emits
the canonical custom-domain URL.

## Git and deployment state

- GitHub main at 2cb33e8ecd5e6dd3c7dbbfeed62566315f5bf53a is the deployed Pages
  source. The latest successful Pages run observed during this work was
  [run 33620119018](https://github.com/MrDemonWolf/howlbox/actions/runs/33620119018).
- GitHub Pages is configured with `howlbox.mrdemonwolf.dev`. Cloudflare has an
  explicit DNS-only CNAME to `mrdemonwolf.github.io`, and public DNS resolves
  to that target. GitHub has not issued the HTTPS certificate yet
  (`https_certificate: null`, `https_enforced: false`), so the deploy guard is
  holding the root-path artifact. The existing wildcard record is unchanged.
- The GitHub organization domain `mrdemonwolf.dev` is verified, which satisfies
  GitHub's ownership prerequisite for adding this subdomain.
- The branch now builds for `/` and uses the custom hostname for canonical,
  social, and copy-ready overlay URLs. The currently deployed Pages artifact
  remains unchanged until HTTPS is ready and the root build is deployed.
- The home checkout is clean and aligned with origin/main.
- The former divergent local main tip is retained at
  rescue/main-before-align-20261008.
- Changes in this task are isolated on
  codex/howlbox-robustness-20261008 in a separate worktree.
- GitHub main has no branch protection. The Pages workflow now runs the full
  verification suite before creating a deployment artifact, which prevents a
  failing build, unit test, or browser test from reaching Pages.

## Work completed on this branch

### Overlay correctness

- Bare custom badge art now covers every fetched version of its badge set.
  An explicit version pair still wins, regardless of pair ordering.
- Emote and badge maps keep stable refs so they do not reconnect Twitch chat.
  When a map arrives or refreshes, the retained message rows are resolved again.
  Moderation-delayed messages use the latest maps when they are released.
- Messages from the owner login mrdemonwolf receive a small wolf image badge.
  The badge follows the existing image badge visibility setting.
- The seeded configurator demo includes a MrDemonWolf sample message with the
  same owner badge.
- The existing custom art validation and precedence order remain in place:
  fetched Twitch art, then badgegist, then inline badgeart.

### Landing page and docs

- The landing hero keeps “Build your URL” as its primary action and now uses
  “Read the docs” as its secondary action. The site header already exposes the
  GitHub source link.
- The parameter reference has client-side search over names, accepted values,
  and descriptions. Search results link to the existing #param-* anchors.
  The current on-page table of contents and deep links remain available.
- The configurator switches between demo chat and live chat. Live mode connects
  only when a valid channel login is entered; demo mode stays offline.
- Live preview waits 500ms after a valid channel edit before reconnecting or
  fetching channel-specific media. Form state and generated URLs stay immediate.
- Import accepts the old `mrdemonwolf.github.io/howlbox/overlay` URL and emits
  the canonical root URL on `howlbox.mrdemonwolf.dev`.

### Browser tests and deployment safety

- Playwright runs against the built Vite preview, with its base path read from
  BASE_PATH. The suite covers the landing page, docs links and search, the
  configurator, overlay setup guidance, and a valid-channel overlay startup.
  The overlay smoke test blocks external HTTP and WebSocket traffic.
- Additional browser tests verify legacy URL import and switching between demo
  chat, rendering the owner badge, and an actual mocked live socket attempt.
- The CI script now includes the browser suite. Both pull request CI and the
  Pages artifact build install headless Chromium before running it. `actionlint`
  passes on both workflow files. Playwright always starts its own preview, so a
  different worktree cannot silently supply the test server.
- The independent Codex review is complete. Its three findings were fixed and
  the follow-up review found no remaining actionable issues.

## Research findings

The Mobbin review found that HowlBox already has strong basics: a clear
product-first hero, a live overlay preview, visible product limits, and a
section-based docs layout with stable anchors. The best next step is clearer
movement between setup and reference material, followed by faster discovery
inside the parameter list. The existing design tokens and client-only approach
are a good fit, so the work should improve those patterns instead of replacing
them.

Useful references reviewed:

- [Jitter hero](https://mobbin.com/sites/sections/eb3f7b2f-79e4-44bf-a4e8-2c277be63268)
  and [Maze hero](https://mobbin.com/sites/sections/efd123f4-8694-4da2-ad1e-7382fef9d90d)
  use a direct primary action and a useful secondary path. Applied to the
  landing page as builder plus docs.
- [Framer feature section](https://mobbin.com/sites/sections/16fc8417-50fc-445e-8cca-e87fc08073ce)
  keeps product proof close to the explanation. HowlBox already does this with
  its real overlay preview; preserve it.
- [OpenAI Platform docs](https://mobbin.com/screens/1b39571a-c929-4ba6-934c-9786fc50681d),
  [Hashnode](https://mobbin.com/screens/37af2131-4bd5-4cb2-a888-7abdb45791b8),
  [Codecademy](https://mobbin.com/screens/4685acfd-ce18-451f-8621-3b9958dda6ae),
  [GitBook API](https://mobbin.com/screens/5f15798e-7b7e-43f2-9a66-740564ad9a26),
  and [AirOps REST docs](https://mobbin.com/screens/a160611c-6fec-46bc-88c1-4aff9898cd36)
  show useful patterns for searchable references, visible section context, and
  consistent parameter examples.
- Playwright's official guidance covers
  [local web servers](https://playwright.dev/docs/test-webserver) and
  [CI browser setup](https://playwright.dev/docs/ci). The current suite uses a
  local production preview and headless Chromium.

## Staged plan

### Stage 1: Stabilize and protect delivery

Status: implemented on this branch.

- Keep the deployed main checkout untouched during feature work.
- Preserve the prior local commit before repairing branch alignment.
- Require lint, type checks, unit tests, production build, and Playwright before
  a Pages artifact is produced.
- Finish with an independent Codex review of the complete diff.

Exit criteria: clean diff checks, all automated checks pass, and no unresolved
review findings. The release decision is tracked in Stage 5.

### Stage 2: Close overlay correctness gaps

Status: fixes and focused regression tests are implemented.

- Verify set-wide badge art and version-specific override behavior.
- Verify rows can receive late emote and badge data without reconnecting chat.
- Verify pending moderation rows use newly available media.
- Verify the owner mark uses the official site icon and respects badges=false.

Exit criteria: unit tests cover the resolver and precedence rules; a manual OBS
source check confirms the icon size and visual fit on an owner message.

### Stage 3: Make docs and setup easier to use

Status: navigation, search, the legacy URL migration, and the demo/live preview
switch are implemented.

- Keep the new search local and small. Do not add a search service or database.
- Consider showing the default and a copy-ready example consistently for every
  URL parameter. Keep the existing anchors stable while editing the docs.
- Review the search and parameter layout at 320px and 390px, in light and dark
  site themes, before changing spacing or hierarchy.
- Keep the configurator's real preview and generated URL close to the controls.

Exit criteria: a streamer can find a setting by name or behavior, follow its
anchor, and copy a valid URL on desktop and a narrow phone viewport.

### Stage 4: Measure overlay performance before optimizing

Status: no unprofiled runtime rewrite has been made.

- Establish a baseline with a deterministic message fixture at 50 and 200 rows.
- Measure message append, list render, image decode, ticker animation, and
  retained memory with a busy chat fixture. Use the repo's xqc overlay smoke
  check when validating the live connection.
- The current built overlay bundle is 34.23 KB gzip, about 0.16 KB above the
  deployed baseline. This change fixes correctness; it does not claim a speedup.
- Compare normal stack, ticker, badges and emotes enabled, and reduced motion.
- Only optimize a measured bottleneck. Keep the existing message cap, stable
  ticker refs, reduced-motion behavior, and one-theme CSS loading.

Exit criteria: record the baseline first, make one focused change at a time,
then compare the same fixture and OBS Browser Source behavior.

### Stage 5: Release

Status: Pages custom domain and DNS-only Cloudflare CNAME are configured.
GitHub's HTTPS certificate is pending, so the root-path build has not been
deployed. A main push deploys immediately, and the root build's absolute asset
URLs are incompatible with the current `/howlbox/` project URL. The deploy job
requires the Pages domain, DNS-only CNAME, and a successful HTTPS response
before publishing.
GitHub Actions publishing does not need a repository `CNAME` file.

- Run bun run ci with BASE_PATH=/.
- Independent Codex review is complete with no remaining actionable findings.
- Wait for GitHub HTTPS readiness, then merge through the normal GitHub
  workflow and verify the Pages deployment and live landing, docs,
  configurator, and overlay routes.
- Treat CI success as a gate, not as proof that a real OBS source or live Twitch
  chat was checked.

## Current evidence and limits

- Before edits, all 241 existing unit tests and the full existing CI script
  passed.
- `BASE_PATH=/ bun run ci` passed after the latest changes: Biome, check-types,
  unit tests, production build, and all 9 Chromium E2E tests passed. Biome
  reports two existing CSS specificity warnings. `actionlint` and
  `git diff --check` also passed.
- The built home, docs, configurator, sitemap, and robots file use the target
  hostname, with app assets and routes at the domain root.
- The root-path app is visible in the local dev preview at
  `http://127.0.0.1:4174/`. The current GitHub Pages artifact has not changed.
- The independent Codex review of the latest diff found no remaining
  actionable issues after the Pages, DNS, HTTPS, owner badge, and socket checks
  were tightened.
- The current favicon exposed by mrdemonwolf.com is a 192 by 192 PNG, not an SVG.
  The owner badge uses that official asset at
  https://www.mrdemonwolf.com/wp-content/uploads/2022/12/cropped-logo-white-border-192x192.png.
  Because it is hosted on the website, the badge depends on that URL remaining
  available.
- The browser suite does not open a live Twitch connection or prove the icon in
  OBS. Those checks remain manual.
