# HowlBox

Self-hosted, client-only Twitch chat overlay for OBS browser sources.
Better-T-Stack monorepo: `apps/web` (React 19 + TanStack Router on
Vite, Tailwind 4) + `packages/ui` (shadcn primitives) +
`packages/config` (tsconfig base). Bun workspaces + Turborepo + Biome.

## Hard rules

- TypeScript strict everywhere. Client-only: no backend, no OAuth, no
  secrets, no API keys. Anonymous Twitch IRC only.
- All overlay configuration rides in URL query params. Bad or missing
  values MUST fall back to defaults, never a blank overlay.
- No em dashes anywhere (code, copy, commits, docs). No emojis.
- Dependency-light. Prefer stdlib/platform/existing deps.
- Commit in small logical chunks, conventional-commit style subjects.
- README is in the MrDemonWolf house format; keep the section order.

## Commands

- `bun run dev:web` - web dev server on port 3001 (preview config in
  `.claude/launch.json`)
- `bun run dev` - all apps via turbo
- `bun run check-types` - vite build + tsc across workspaces
- `bun run check` - biome lint + format (auto-fixes)
- `bun run build` - static site to `apps/web/dist`

## Architecture

- `apps/web/src/lib/twitch/chat.ts` - anonymous ChatClient wrapper.
  v8 gotchas: `connect()` returns void; event channel args have no
  `#` prefix; unset user color arrives as `""` not undefined. Each
  reconnect nudge retires the whole client generation, and every
  handler checks generation identity so a late handshake cannot leave
  an orphan socket. Visibility, online, and OBS show/activate events
  trigger nudges; OBS hide/deactivate events do not. Never add timer
  retry loops because hidden sources throttle timers.
- `apps/web/src/hooks/use-twitch-chat.ts` - message list state,
  filters (hidden/allowed logins, `!commands`), moderation delay
  buffer (bounded; deletes/timeouts/bans evict pending messages),
  dedupe by id, `active` stale-closure guard.
- `apps/web/src/lib/emotes/` - 7TV/BTTV/FFZ fetch and cache,
  media variant selection, zero-width grouping, and text tokenization.
  `lib/cache.ts` provides validated JSON fetches, caller cancellation,
  a 10-second timeout, scoped outage cooldowns, localStorage TTLs,
  stale-if-error, and quota-driven eviction. Global providers load in
  parallel with the FFZ room; the room supplies a Twitch id when
  available, with a cached ivr.fi fallback. Channel emotes override
  globals. Resolution happens at append time through stable refs so
  rows stay memoized and loaded maps never reconnect chat. Refreshes
  preserve the last nonempty in-memory map on total provider failure.
- `apps/web/src/lib/twitch/badges.ts` - badge art via api.ivr.fi
  (Helix-shaped, open CORS, includes channel subscriber art). Custom
  overrides are `badgeart` inline pairs and a public `badgegist` JSON
  map or pair list. Precedence is Twitch < gist < inline. Periodic
  `refresh` bypasses only channel and gist TTLs; global badges retain
  their six-hour TTL. Each provider failure is isolated.
- `apps/web/src/lib/twitch/pronouns.ts` - lazy per-user pronoun
  lookups through pronouns.alejo.io. The first message can miss and
  later messages hit the synchronous append-time cache. Work is capped
  at four concurrent and 500 pending lookups, with a 2,000-entry LRU
  and provider cooldown. A successful empty response is negative
  cached; transport and validation failures are not. Gated by the
  opt-in `pronouns` param.
- `apps/web/src/lib/twitch/events.ts` + the USERNOTICE listeners in
  `chat.ts` - sub/gift/raid/cheer/first-chat/announcement rows, gated by
  the `events` param. Anonymous IRC carries all of it: subs and raids
  are USERNOTICE (twurple `onSub`/`onResub`/`onSubGift`/
  `onCommunitySub`/`onPrimePaidUpgrade`/`onGiftPaidUpgrade`/`onRaid`/
  `onAnnouncement`), cheers ride `msg.isCheer`/`.bits` on a normal
  message, first-timers ride `.isFirst`/`.isReturningChatter`. Only
  follows need EventSub. An event is NOT a second stream: it is a
  `ChatMessageView` with an `event` field, so it inherits the delay
  buffer, dedupe, `max`, fade and emote resolution for free. Two row
  shapes, split by `isStandaloneEvent`: sub/raid drop the author header
  (the text is a whole sentence naming everyone), cheer/first/announce
  keep it. Event rows set `isPrivileged` so a raid alert is never held
  behind the mod delay. Cheermote art is a pure URL off
  static-cdn.jtvnw.net for the global tiers (1/100/1000/5000/10000);
  channel-custom cheer prefixes would need Helix, so they stay text.
  A mass gift MUST collapse to one row: Twitch sends one
  `submysterygift` announcing the count and then one `subgift` per
  recipient, so rendering both means 101 rows for a 100-gift bomb.
  `createGiftDeduper` swallows the per-recipient notices behind their
  batch line (keyed by gifter, counted down, time-boxed so a standalone
  later gift still renders). `events.test.ts` (`bun test`) covers the
  wording, tier bucketing and the real captured gift-bomb sequence.
- `apps/web/src/lib/twitch/avatars.ts` - lazy profile pictures via
  api.ivr.fi. Logins collect for 300ms and flush in batches of 50, with
  at most two requests active, 1,000 pending logins, a 2,000-entry LRU,
  payload validation, and an outage cooldown. `logo` URLs are reduced
  from 600x600 to 70x70. `avatars=subs` uses the subscriber tag already
  on the message, so deciding whether to fetch costs nothing.
- `apps/web/src/lib/overlay/config.ts` - dependency-free URL types,
  enums, defaults, normalizers, and OBS asset-scale selection shared by
  both entry paths. `params.ts` layers the canonical Zod schema over
  it for site-router use. `parse-search.ts` mirrors the TanStack default
  decoder and schema fallbacks without importing TanStack or Zod, so
  direct OBS startup stays small. Its parity test MUST compare against
  `defaultParseSearch`, including duplicate and JSON-shaped values.
- `apps/web/src/lib/overlay/url.ts` - `buildOverlayUrl` /
  `overlayQuery`: serialize a config into the overlay query string,
  omitting defaults. Inverse of `params.ts`, so it round-trips.
  `ConfigBuilder` uses it instead of a hand-rolled query ladder.
- `apps/web/src/components/chat/` - renderer (Tailwind classes) and
  `overlay.css` (per-theme variables plus transform/opacity keyframes).
  `ChatMessageRow` is memoized. `message-list.tsx` maps each theme to a
  conservative solid surface reference for dynamic-name contrast;
  transparent mode uses an opposite-luminance outline. `hb-root.tsx`
  owns the shared wrapper, a 12px readability floor, and theme-gated
  loading of the Latin-only arcade font.
- `apps/web/src/lib/overlay/theme-meta.ts` - `THEME_SWATCH` (picker
  gradient), `THEME_LABEL` (human name), `BG_LABEL`, each keyed by the
  enum as a `Record<Theme, ...>` so a new theme fails to compile until
  it is labeled. The landing/config pickers read these; the enum value
  stays the URL contract.
- `apps/web/src/routes/docs.tsx` - `/docs`, the reference: quick start,
  every URL param grouped the way the configurator groups them (each
  with a `#param-<name>` anchor so writeups can deep-link), theme
  values, the two custom badge art formats, the `hb-*` Custom CSS
  contract, troubleshooting, and an explicit "what it will not do"
  section (anonymous IRC cannot send, moderate, or see EventSub). The
  param copy here is canonical; README's table is the short version.
- `apps/web/src/routes/` - `/` landing, `/config` URL builder, and
  the router wrapper for `/overlay`. `bootstrap.ts` detects the overlay
  pathname before site code loads, stamps transparency synchronously,
  and imports `overlay-main.tsx`; every other route imports `main.tsx`.
  `overlay-app.tsx` holds the shared overlay runtime. The direct CSS
  entry uses `source(none)` plus explicit overlay sources so site
  utilities, Inter, TanStack Router, and Zod do not enter the OBS graph.
  Shared site chrome is `components/landing/site-chrome.tsx`. The
  landing and builder previews use the real `MessageList` and `HbRoot`
  with canned data from `demo-messages.ts`.
- Site color: `--site-*` tokens in `index.css`, a light default plus a
  `.dark` override and a `prefers-color-scheme` fallback, all scoped to
  `html:not(.hb-overlay)`. Flat surfaces only (base / surface / elev +
  hairline), no ambient background layers. `next-themes` (already a dep
  via sonner) owns the html class and its persistence; `main.tsx`
  paints the same class synchronously so the first frame is not the
  wrong mode. Brand splits in two: `--site-brand` is the fill,
  `--site-brand-text` is brand-colored text (cerulean fails AA as text
  on white). Site type is Inter (`.hb-display` for headings); the
  overlay's `--hb-*` theme contract is untouched by any of this.

## SEO and social

- `apps/web/src/lib/seo/routes.ts` is the single source: `SEO_ROUTES`
  (path, title, description, og image, index flag), `SITE_URL`,
  `canonicalFor`, and the `WebApplication` JSON-LD. Add a route here
  when you add one to `routes/`.
- `apps/web/vite-plugin-seo.ts` runs on `closeBundle` and writes one
  real `dist/<route>/index.html` per route with its own head, plus
  `404.html`, `robots.txt`, `sitemap.xml`. This exists because GitHub
  Pages otherwise answers every route but `/` from `404.html` with an
  HTTP **404 status**, which Google will not index no matter what the
  body renders. The head is swapped between the `SEO:BEGIN` /
  `SEO:END` markers in `index.html`; do not reformat those comments.
- Canonical form is WITH a trailing slash, matching the GitHub Pages
  directory redirect. TanStack Router matches `/docs/` to `/docs`.
- `/overlay` gets `noindex, nofollow` and no canonical, and stays out
  of the sitemap. `robots.txt` cannot help: it is only read from the
  host root, so on a project subpath it is inert.
- No `aggregateRating` in the JSON-LD. Google requires a rating for the
  Software App rich result, there is no honest rating data, and
  inventing one is the self-serving-review pattern that earns a manual
  action. No `FAQPage` markup either: Google deprecated that rich
  result on 2026-05-07.
- OG images: `bun run og` renders `public/og*.png` through headless
  Chrome from `scripts/build-og.ts`. Manual on purpose, never in CI.
  Chrome rather than an SVG rasterizer because Inter ships woff2 only
  and every Node-side rasterizer wants TTF or OTF; the template embeds
  the woff2 so output does not depend on installed system fonts.
  Version the file name if art changes, since X has no cache purge.

## Copy

Landing and docs copy is written against a checklist derived from
research on what reads as LLM-written. The durable rules: no trailing
participial clauses that editorialize (`ensuring...`, `reflecting...`),
no "not X, it's Y" antithesis, no three-item list where item three is a
synonym of item one, no `seamless / effortless / leverage / robust /
powerful / comprehensive`, vary paragraph length on purpose, and state
at least one real limitation above the fold. Prefer a claim a reader
could disprove in two minutes (a number, a version, a named system)
over an adjective.

## URL params

Schema lives in `lib/overlay/params.ts`. Full param reference is the
Usage table in `README.md`; keep both in sync. Defaults:
`bg=off`, `theme=wolf`, `max=50`, `delay=0`, `fade=0`, `refresh=0`,
`avatars=off`, `media=animated`, `emotescale=1`, `events` empty,
`badgeart`/`badgegist` empty, `badges`
and `animate` on, all other flags off (`pronouns` too - opt-in, since
it is a per-user pronouns.alejo.io lookup; `avatars` for the same
reason). Ranges: `max` 1-200, `delay` 0-300s, `fade`
0-600s, `refresh` 0 or 1-1440min (1-4 round up to 5), `emotescale` 1-4
in half steps. That
last one is the only non-integer param: it snaps to the nearest half
step rather than rejecting, in BOTH `params.ts` and `parse-search.ts`,
or the parity test fails. It also feeds `assetScaleFor` alongside
`size`, since a 3x emote needs the same source art a 300% overlay does.
`channel`/`hide`/`allow` validate against
the Twitch login regex; bad logins are dropped, not errored. Custom
badge art (`badgeart`, `badgegist`) is parsed/validated in
`lib/twitch/badges.ts`. `events` is a comma list of `sub,cheer,raid,
first,announce` (plus an `all` shorthand) filtered by
`normalizeEventList`; like `hide`/`allow` it needs the string-or-array
preprocess, since the router re-serializes the validated value.

## OBS constraints (research-verified; do not violate)

- `backdrop-filter` can NEVER blur the game feed: OBS composites
  video outside the page and CSS samples page pixels only. Overlay
  glass is faked with gradient fills + hairline borders + inset
  specular highlights + cheap CSS grain. Zero blur filters on the
  overlay (CPU-raster OBS setups); fine on the landing page.
- Animate transform/opacity only. Entrance/auto-hide are pure CSS
  animations (their clocks keep running while OBS hides the source;
  JS timers get throttled).
- Dark glass fills need roughly 60%+ effective opacity for WCAG AA
  text over arbitrary gameplay. `prefers-reduced-transparency` swaps
  `--hb-surface` to `--hb-surface-solid` (the override selector must
  tie theme-block specificity: `.hb-root, .hb-root[data-theme]`).
- `hb-*` class names are a public contract for the OBS Custom CSS
  field. Never rename them. That now includes `hb-avatar`,
  `hb-event-line` and `hb-cheermote`, plus the `data-event="<kind>"`
  attribute on `hb-message` (so `hb-message[data-event="raid"]` can be
  styled on its own).
- OBS shows no error UI for browser sources; the overlay renders its
  own status pill (connecting / disconnected / could not join).
- Target Chromium 127 (OBS 31+). devicePixelRatio is always 1.

## Theme system

`wolf` is the base `.hb-root` block in `components/chat/overlay.css`;
every other theme is its own chunk at `components/chat/themes/<name>.css`
holding one `[data-theme="name"]` block that overrides: `--hb-font`,
`--hb-font-size`, `--hb-radius`, `--hb-text`, `--hb-surface` (full
background shorthand, can stack noise/gradients), `--hb-surface-solid`
(reduced-transparency fallback, REQUIRED), `--hb-border`,
`--hb-shadow`, `--hb-glow` (text glow in panel/bubble modes),
`--hb-shadow-off` (bg=off legibility stack, must outline all four
directions), optional `--hb-mask`, plus the avatar shape
(`--hb-avatar-size`/`--hb-avatar-radius`/`--hb-avatar-ring`) and
`--hb-event-accent` where the `.hb-root` circle-and-blue default is
wrong. The OBS entry loads exactly one chunk: `overlay-main` awaits
`themes/load.ts` `loadThemeCss(theme)` before first render. The loader
never rejects and races a 2s timeout, so a missing chunk renders on the
wolf base instead of blanking, and a late chunk still applies; no retry
loops (hidden sources throttle timers). The site imports the
`themes/index.css` aggregate (deliberately CSS `@import`, not JS, so the
chunk module ids stay out of the site JS graph and rolldown cannot
dedupe site CSS into the OBS path).

Each chunk ENDS with its own `@media (prefers-reduced-transparency:
reduce)` block covering `.hb-root[data-theme="x"]` and
`.hb-root[data-theme="x"][data-variant]`. This is load-bearing: chunks
load AFTER the base sheet, so base's own override block would lose the
specificity tie on document order. The base block stays as the safety
net for wolf and failed chunks. `themes.test.ts` enforces chunk
existence, the required vars, the override's presence and position, and
that no `[data-theme` block drifts back into `overlay.css`.

`?variant` selects a color variation of a theme:
`[data-theme="x"][data-variant="y"]` blocks inside the theme's own
chunk, listed in `THEME_VARIANTS` in `lib/overlay/config.ts` (the URL
contract; both parsers validate through the shared `normalizeVariant`,
unknown values fall back to the theme default and serialize as no
param). A variant block overrides COLOR vars only (text, surfaces,
border, shadows, glow, shadow-off, event accent, avatar ring), never
fonts/radius/mask/avatar geometry, and if it touches `--hb-surface` it
must also set `--hb-surface-solid`. `HbRoot` stamps `data-variant` only
for a real selection, so the attribute's absence IS the default state;
`data-variant` is part of the public OBS Custom CSS contract alongside
the `hb-*` class names.

`?layout` / `?align` / `?group` are the message-layout axis, orthogonal
to themes: the row's author header (time, avatar, badges, pronouns,
name) is wrapped in `hb-head`, `display: contents` by default so the
inline flow is untouched. `layout=stacked` promotes it to its own line
and hides `hb-sep`; `align=right` right-aligns the column; `group`
hides the header on a row whose predecessor is the same chatter
(recomputed from adjacency, so evictions regrow headers; event rows
never group). All three are pure CSS keyed off `data-layout`/
`data-align` on `hb-root` and `data-grouped` on the row, so
`ChatMessageRow` stays memoized. `hb-head` and the three data
attributes are part of the frozen OBS Custom CSS contract.

Adding a theme: chunk file + `@import` line in `themes/index.css` +
loader entry in `themes/load.ts` + the `THEMES` enum in
`lib/overlay/config.ts` + `THEME_SWATCH` and `THEME_LABEL` in
`lib/overlay/theme-meta.ts` + a conservative solid reference in
`THEME_SURFACE_REFERENCE` in `message-list.tsx` (all `Record<Theme,
...>`, so the compiler forces every entry) + the README table. Adding a
variant: CSS block in the chunk + `THEME_VARIANTS` entry + a
`VARIANT_SURFACE_REFERENCE` color in `message-list.tsx` (typed off
`THEME_VARIANTS`, compiler-forced) + README/docs.

`?emotescale` rides THREE vars, all defaulting on `.hb-root` in the same
block as the avatar vars, and the split is load-bearing:
`--hb-emote-scale` is the OBS Custom CSS hook and is never written
inline; `--hb-emote-boost` is the configured multiplier, written inline
on `.hb-root` by `HbRoot`; `--hb-emote-jumbo` is the boost in force on
one row, set inline by `chat-message.tsx` ONLY where `isEmoteOnly` holds.
`.hb-emote`/`.hb-cheermote` height multiplies the hook by the row value.
Do NOT collapse the hook and the row value into one name: an inline
row-level write beats an inherited `.hb-root` rule, so a Custom CSS
`--hb-emote-scale` would then silently skip the jumbo rows, which is the
one place it most obviously should apply. Keeping the gate in CSS rather
than a prop is what lets `ChatMessageRow` stay memoized and spares
`MessageList`/`ChatOverlay` a pass-through;
`hb-message[data-emote-only]` targets the jumbo rows on their own.

`isEmoteOnly` takes a second `hasCheermote` argument. A cheer's `CheerN`
tokens are stripped from the body, so a bits-only message reaches the row
with NO parts while still rendering tier art; without the flag it would
be the one all-art body that does not grow.

`--hb-emote-align` is the fourth: `middle` normally, `bottom` once
`emotescale` is above 1, written by `HbRoot` and obeyed only by
`hb-message[data-emote-only]`. Centring an image on the text line is
right at chat size and wrong once the art is several times the line
height, because the name ends up floating against the middle of a tall
block. Measured on a 77px emote: `middle` left the name 31px above the
emote's lower edge, `bottom` closed that to 2px. `baseline` looks the
same but adds ~5px of descender leading under every jumbo row.

The jumbo DECAYS with the art count: `emoteOnlyCount` feeds
`calc(1 + (var(--hb-emote-boost,1) - 1) / N)`, so the extra size is shared
out and a row's added width stays near `(scale - 1)` emote widths however
many were spammed. Measured against live chat before it existed: eleven
emotes at `emotescale=3` in a 370px source wrapped to four lines, 275px,
35% of the overlay. Do not "simplify" this back to a flat multiplier.
Keep it a `calc()` rather than resolving the number in JS, or the boost
stops being overridable from OBS Custom CSS. `emoteOnlyCount` returning 0
means "not emote-only", and the row only divides when it is above 0, so
the division can never be by zero.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`: bun build with
`BASE_PATH=/howlbox/` (vite `base` + router `basepath` read it). The
workflow no longer copies `index.html` to `404.html`; the seo plugin
writes a noindexed `404.html` during the build, along with a real
`index.html` per route so `/overlay` and the rest resolve with a 200
instead of the SPA fallback's 404 status. Also runs anywhere static
(Coolify) by serving `apps/web/dist`.

## Verifying changes

Preview server: `web` config on port 3001. Verify overlay changes
against a busy live channel (xqc is the house test channel: fast
chat, ~970 7TV emotes, custom sub badges). The landing demo chat uses
canned messages and the real `ChatMessageRow`, no connection.
