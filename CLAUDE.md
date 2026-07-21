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
  `#` prefix; unset user color arrives as `""` not undefined. A
  `closed` flag guards every handler (quit can race the handshake and
  leave auto-reconnecting zombies; onConnect re-quits them).
  Reconnects are nudged by events (visibilitychange, online, OBS
  custom events), never timer loops: OBS throttles timers in hidden
  sources.
- `apps/web/src/hooks/use-twitch-chat.ts` - message list state,
  filters (hidden/allowed logins, `!commands`), moderation delay
  buffer (bounded; deletes/timeouts/bans evict pending messages),
  dedupe by id, `active` stale-closure guard.
- `apps/web/src/lib/emotes/` - 7TV/BTTV/FFZ fetch + cache and
  text-part tokenization. Fetch/cache is the generic `cachedJson<T>`
  in `lib/cache.ts` (localStorage, stale-if-error, named TTL consts,
  `AbortSignal.timeout`, quota-driven eviction). Globals fetch in
  parallel with the FFZ room; the FFZ room lookup doubles as
  login-to-id resolver (ivr.fi fallback, itself cached). Channel
  emotes override globals. 7TV `flags & 1` = zero-width overlay
  emote. Resolution happens at APPEND time through stable refs so
  rows stay memoized and late-loading maps never reconnect chat;
  `useEmoteMap`/`useBadgeMap` share a generic `useAsyncRef`
  (`hooks/use-emotes.ts`).
- `apps/web/src/lib/twitch/badges.ts` - badge art via api.ivr.fi
  (Helix-shaped, open CORS, includes channel sub art). Old
  badges.twitch.tv is DNS-dead; Helix needs a token. Never add either.
  Custom overrides: `badgeart` (inline `set=url`/`set/version=url`
  pairs) and `badgegist` (a public GitHub gist of the same pairs or a
  JSON map, fetched tokenless through the cache). Precedence Twitch <
  gist < inline; a bare `set` key covers every version (resolve.ts
  falls back to it). `refresh` (minutes, 0=off, 5-min floor) re-fetches
  emote+badge maps with the cache TTLs bypassed via the `force` arg on
  `cachedJson`.
- `apps/web/src/lib/twitch/pronouns.ts` - pronoun badges via
  pronouns.alejo.io (CORS `*`, no auth; the service 7TV/FFZ read).
  Per-USER not per-channel, so nothing to prefetch: `warmPronoun`
  fire-and-forgets a cached lookup on first sight of a login,
  `resolvePronoun` reads the sync cache at append time. First message
  from a user can miss the badge; repeats hit. Gated by the `pronouns`
  param. Badges are a `RenderBadge` union (`types.ts`): image badges +
  the text pronoun badge share the row, built in `resolve.ts`.
- `apps/web/src/lib/overlay/params.ts` - zod schema for all URL
  params. CRITICAL: TanStack Router JSON-types search values
  (`?channel=123456` arrives as a number); scalars are stringified in
  preprocess before validation. Every field ends in `.catch(default)`.
  Exports the `Theme`/`BgMode` types (import them, don't re-derive),
  `OVERLAY_DEFAULTS` (the shared default set), and `normalizeLoginList`
  (regex login filter shared with the config builder).
- `apps/web/src/lib/overlay/url.ts` - `buildOverlayUrl` /
  `overlayQuery`: serialize a config into the overlay query string,
  omitting defaults. Inverse of `params.ts`, so it round-trips.
  `ConfigBuilder` uses it instead of a hand-rolled query ladder.
- `apps/web/src/components/chat/` - renderer (Tailwind classes) +
  `overlay.css` (per-theme variable blocks + overlay keyframes/mask).
  `ChatMessageRow` is memoized; keep its props primitive/stable.
  `message-list.tsx` (`MessageList`) is the shared `hb-messages`
  column plus `surfaceToneFor(theme, bg)`; `hb-root.tsx` (`HbRoot` +
  `HB_ROOT_CLASS`) is the shared themed wrapper. `ChatOverlay`, the
  landing `OverlayPreview`, and `ThemeWall` all render `MessageList`
  inside `HbRoot`, owning only their own positioning.
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
- `apps/web/src/routes/` - `/` landing, `/config` the URL builder
  (`ConfigBuilder` + live `OverlayPreview`), `/overlay` the OBS page.
  Shared chrome is `components/landing/site-chrome.tsx`: `SiteShell`
  (the one page wrapper: header, main, footer, `Toaster`; all three
  site routes use it), `Band` (full-bleed section that alternates
  `hb-bg-base` / `hb-bg-surface`), `SectionHead` + `Kicker` (the
  numbered spine), the `MONO` machine voice + `Eyebrow`, `OBSSteps`,
  and the exported `DISCLAIMER` (footer affiliation line, mirrors the
  wolfathon pattern). The landing arc mirrors the wolfwave docs home:
  hero + fact strip, 01 audiences, 02 `ThemeWall`, 03 display modes
  (three live `OverlayPreview`s), 04 comparison table, 05 setup,
  06 privacy, 07 FAQ, CTA. `ThemeWall` renders all 15 themes with the
  REAL `MessageList` over a static sample; the canned live stream is
  `demo-messages.ts`. `main.tsx` adds the `hb-overlay` html class
  synchronously before React so OBS never sees an opaque flash; the
  transparency CSS lives in eager `index.css`.
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
`bg=off`, `theme=wolf`, `max=50`, `delay=0`, `fade=0`, `refresh=5`,
`badgeart`/`badgegist` empty, `badges` and `animate` on, all other
flags off (`pronouns` too - opt-in, since it is a per-user
pronouns.alejo.io lookup). Ranges: `max` 1-200, `delay` 0-300s, `fade`
0-600s, `refresh` 0 or 5-1440min. `channel`/`hide`/`allow` validate against
the Twitch login regex; bad logins are dropped, not errored. Custom
badge art (`badgeart`, `badgegist`) is parsed/validated in
`lib/twitch/badges.ts`.

## OBS constraints (research-verified; do not violate)

- `backdrop-filter` can NEVER blur the game feed: OBS composites
  video outside the page and CSS samples page pixels only. Overlay
  glass is faked with gradient fills + hairline borders + inset
  specular highlights + feTurbulence noise. Zero blur filters on the
  overlay (CPU-raster OBS setups); fine on the landing page.
- Animate transform/opacity only. Entrance/auto-hide are pure CSS
  animations (their clocks keep running while OBS hides the source;
  JS timers get throttled).
- Dark glass fills need roughly 60%+ effective opacity for WCAG AA
  text over arbitrary gameplay. `prefers-reduced-transparency` swaps
  `--hb-surface` to `--hb-surface-solid` (the override selector must
  tie theme-block specificity: `.hb-root, .hb-root[data-theme]`).
- `hb-*` class names are a public contract for the OBS Custom CSS
  field. Never rename them.
- OBS shows no error UI for browser sources; the overlay renders its
  own status pill (connecting / disconnected / could not join).
- Target Chromium 127 (OBS 31+). devicePixelRatio is always 1.

## Theme system

Each theme is a `[data-theme="name"]` block in
`components/chat/overlay.css` overriding: `--hb-font`,
`--hb-font-size`, `--hb-radius`, `--hb-text`, `--hb-surface` (full
background shorthand, can stack noise/gradients), `--hb-surface-solid`
(reduced-transparency fallback, REQUIRED), `--hb-border`,
`--hb-shadow`, `--hb-glow` (text glow in panel/bubble modes),
`--hb-shadow-off` (bg=off legibility stack, must outline all four
directions), optional `--hb-mask`. `wolf` is the base `.hb-root`
default (no `[data-theme]` block); the other fourteen are override
blocks. Adding a theme: CSS block + the `THEMES` enum in
`lib/overlay/params.ts` + `THEME_SWATCH` and `THEME_LABEL` in
`lib/overlay/theme-meta.ts` (both `Record<Theme, ...>`, so the
compiler forces the new entry) + the README table. Light-surfaced
themes also join `LIGHT_SURFACE_THEMES` in `message-list.tsx` (user
color readability flips direction there).

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`: bun build with
`BASE_PATH=/howlbox/` (vite `base` + router `basepath` read it),
`404.html` copy of `index.html` for the `/overlay` route. Also runs
anywhere static (Coolify) by serving `apps/web/dist`.

## Verifying changes

Preview server: `web` config on port 3001. Verify overlay changes
against a busy live channel (xqc is the house test channel: fast
chat, ~970 7TV emotes, custom sub badges). The landing demo chat uses
canned messages and the real `ChatMessageRow`, no connection.
