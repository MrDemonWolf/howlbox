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

- `bun run dev:web` - dev server on port 3001 (preview config in
  `.claude/launch.json`)
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
- `apps/web/src/routes/` - `/` landing (hero + stats fact band +
  editorial feature index + `ThemeWall` + CTA), `/config` the URL
  builder (`ConfigBuilder` + live `OverlayPreview`), `/overlay` the
  OBS page. Shared landing chrome is
  `components/landing/site-chrome.tsx`: `PageBackground` (aurora +
  grain + broadcast grid, all `.hb-*` in `index.css`, landing-only,
  never the overlay), the `MONO` machine voice + `Eyebrow` kicker,
  header/footer/OBS steps, and the exported `DISCLAIMER` (footer
  affiliation line, mirrors the wolfathon pattern). `ThemeWall`
  renders all 13 themes with the REAL `MessageList` over a static
  sample; the canned live stream is `demo-messages.ts`. `main.tsx`
  adds the `hb-overlay` html class synchronously before React so OBS
  never sees an opaque flash; the transparency CSS lives in eager
  `index.css`.

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
default (no `[data-theme]` block); the other twelve are override
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
