# HowlBox - Themed Twitch Chat Overlay for OBS

HowlBox is a self-hosted, client-only Twitch chat overlay for OBS
browser sources. It joins Twitch chat anonymously (no login, no OAuth,
no API keys), renders native Twitch, 7TV, BTTV, and FrankerFaceZ
emotes with badge art, and is configured entirely through URL query
parameters so every OBS source URL is self-contained. Built for
streamers who want a modern, beautiful chat overlay without a
third-party service sitting between them and their chat.

Your chat. Your colors. Your howl.

## Features

- **Anonymous chat connection** - Read-only Twitch chat over
  `@twurple/chat`. No account, no keys, nothing to expire mid-stream.
- **15 themes** - Wolf brand glass, macOS-style Liquid Glass, CRT
  terminal, synthwave neon, Windows 95, Windows XP, Xbox, pixel
  arcade, kawaii pastel, celestial galaxy, cozy mocha, esports
  no-box, plus dark, light, and an accessible high-contrast preset.
  All CSS-variable driven.
- **Three display modes** - Transparent messages over gameplay
  (`bg=off`), one themed backdrop panel (`bg=panel`), or per-message
  bubbles (`bg=bubble`).
- **Full emote support** - Native Twitch emotes plus 7TV (including
  zero-width overlay emotes), BTTV, and FrankerFaceZ, resolved per
  channel and cached in localStorage.
- **Badge art without secrets** - Every global and per-channel Twitch
  badge (including subscriber and bits art) via public, CORS-safe
  APIs, plus custom badge art overrides inline through the `badgeart`
  parameter or hosted in a public GitHub gist through `badgegist`.
- **Pronoun badges** - Opt-in (`pronouns=true`) pronoun badges next to
  names, from pronouns.alejo.io, the service 7TV and FrankerFaceZ read.
  Each chatter's login is looked up there; enable it only if that
  third-party call is acceptable for your channel.
- **Moderation aware** - Deleted messages, timeouts, and bans vanish
  from the overlay instantly. An optional delay holds non-mod messages
  so moderation lands before anything renders.
- **Filters** - Hide known bots, hide `!commands`, hide specific
  users, or run featured mode showing only chosen users.
- **URL-only configuration** - Every option is a query parameter. No
  config files, no dashboard, no stored state.
- **Configurator page** - Pick options live at `/config` with a real
  overlay preview, then copy a ready OBS source URL. The landing page
  at `/` shows a theme-switching demo.
- **OBS-optimized** - Transparent from first paint, zero blur filters
  (safe on CPU-rendered setups), event-driven reconnects that survive
  hidden-source timer throttling, and a visible connection status
  pill.
- **Stable styling hooks** - Every element carries `hb-*` class names
  as a contract for the OBS Custom CSS field.

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/mrdemonwolf/howlbox.git
   cd howlbox
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the dev server:

   ```bash
   bun run dev:web
   ```

4. Open `http://localhost:3001` for the landing page, then head to
   `http://localhost:3001/config` to build a URL and add it as an OBS
   browser source.

## Usage

Build an overlay URL with the configurator at `/config`, or hand-write
one:

```
/overlay?channel=mrdemonwolf&theme=wolf&bg=bubble&hidebots=true&fade=30
```

| Parameter      | Values                                   | Description                                             |
| -------------- | ---------------------------------------- | ------------------------------------------------------- |
| `channel`      | Twitch login name                        | Channel to join (required)                              |
| `theme`        | `wolf`, `glass`, `terminal`, `neon`, `dark`, `light`, `contrast`, `cozy`, `nobox`, `retro95`, `xp`, `xbox`, `arcade`, `galaxy`, `mocha` | Color theme preset |
| `bg`           | `off`, `panel`, `bubble`                 | Display mode (default `off`). `panel` draws its backdrop only while there are messages |
| `size`         | percent, `50` to `300` (default `100`)   | Scales the theme's own text size                        |
| `max`          | `1` to `200` (default `50`)              | Max messages kept on screen                             |
| `hidebots`     | flag                                     | Hide known chat bots (Nightbot, etc.)                   |
| `hide`         | comma-separated logins                   | Always hide these users                                 |
| `allow`        | comma-separated logins                   | Featured mode: only show these users                    |
| `hidecommands` | flag                                     | Hide messages starting with `!`                         |
| `delay`        | seconds, `0` to `300` (default `0`)      | Hold non-mod messages so deletions land before display  |
| `badges`       | `false` to disable (default on)          | Badge icons before names                                |
| `pronouns`     | flag                                     | Pronoun badge before names (via pronouns.alejo.io)      |
| `timestamps`   | flag                                     | HH:MM before each message                               |
| `animate`      | `false` to disable (default on)          | Slide/fade entrance animation                           |
| `fade`         | seconds, `0` to `600` (default `0`)      | Auto-hide each message N seconds after it appears       |
| `badgeart`     | comma-separated `set=url` or `set/version=url` pairs | Custom badge art overriding the Twitch defaults |
| `badgegist`    | public gist id or URL                    | Custom badge art hosted in a gist (same pairs, one per line, or a JSON map) |
| `refresh`      | minutes, `0` or `5` to `1440` (default `5`) | Re-fetch emote and badge maps every N minutes (`0` = off) |

Invalid or missing values fall back to safe defaults; a typo in OBS
never produces a blank overlay.

Custom badge art precedence, weakest to strongest: fetched Twitch art,
then `badgegist`, then inline `badgeart`. A bare `set` key (no
`/version`) covers every version of that set. The gist is fetched from
the public GitHub API (no token), which allows 60 unauthenticated
requests per hour per IP; the `5`-minute default `refresh` (and its
5-minute floor) keeps a gist well under that, so no tuning is needed.

In OBS 31 or newer, add a Browser source with the generated URL and
set Width and Height on the source itself (try 480 x 800). Leave
"Shutdown source when not visible" and "Refresh browser when scene
becomes active" off.

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Framework | React 19 + TanStack Router (Vite)   |
| Language  | TypeScript (strict)                 |
| Chat      | @twurple/chat (anonymous IRC)       |
| Emotes    | 7TV, BTTV, FrankerFaceZ public APIs |
| Badges    | api.ivr.fi (Twitch badge art)       |
| Pronouns  | pronouns.alejo.io (opt-in)          |
| Styling   | Tailwind CSS 4 + CSS variables      |
| UI        | shadcn/ui primitives (packages/ui)  |
| Monorepo  | Turborepo + Bun workspaces          |
| Linting   | Biome                               |
| Deploy    | GitHub Pages (static)               |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.3 or newer
- OBS Studio 31 or newer (for overlay testing)

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Run the web dev server:

   ```bash
   bun run dev:web
   ```

### Development Scripts

- `bun run dev`: Start all apps in development mode
- `bun run dev:web`: Start only the web app (port 3001)
- `bun run build`: Build the static site to `apps/web/dist`
- `bun run check-types`: Check TypeScript types across the monorepo
- `bun run check`: Run Biome formatting and linting

### Code Quality

- TypeScript strict mode across every workspace
- Biome for linting and formatting
- Turborepo task caching for fast builds
- `hb-*` class names on overlay elements are a public contract for OBS
  Custom CSS overrides; keep them stable

### Deployment

#### GitHub Pages (default)

Pushes to `main` build and deploy automatically via
`.github/workflows/deploy.yml`. One-time setup: in the repository
settings, set Pages > Source to "GitHub Actions". The site serves at
`https://mrdemonwolf.github.io/howlbox/` (the build sets
`BASE_PATH=/howlbox/`; use a custom domain and drop the variable for
root hosting).

A copy of `index.html` is deployed as `404.html` so the `/overlay`
route resolves on a static host.

#### Coolify or any static host

`bun run build` produces a fully static site in `apps/web/dist`. Serve
that folder as-is (set `BASE_PATH` at build time if hosting under a
subpath). No server runtime is required.

### Test URLs

Once deployed, these are ready to paste into an OBS browser source
(swap the channel for testing against a busier chat):

```
https://mrdemonwolf.github.io/howlbox/overlay?channel=mrdemonwolf&theme=wolf&bg=off&hidebots=true
https://mrdemonwolf.github.io/howlbox/overlay?channel=mrdemonwolf&theme=glass&bg=bubble&fade=30
https://mrdemonwolf.github.io/howlbox/overlay?channel=xqc&theme=terminal&bg=panel&timestamps=true
```

Suggested source size: 480 x 800 at the default font scale.

## Project Structure

```
howlbox/
├── apps/
│   └── web/
│       └── src/
│           ├── components/
│           │   ├── chat/      # Overlay renderer + theme CSS variables
│           │   └── landing/   # Landing demo + /config URL builder
│           ├── hooks/         # Chat connection, emote/badge loading
│           ├── lib/
│           │   ├── emotes/    # 7TV/BTTV/FFZ fetch, cache, resolution
│           │   ├── overlay/   # URL param schema + builder
│           │   └── twitch/    # Anonymous chat client, badges, colors
│           └── routes/        # / landing, /config builder, /overlay
├── packages/
│   ├── config/                # Shared tsconfig base
│   └── ui/                    # Shared shadcn/ui components and styles
├── .github/workflows/         # CI deploy to GitHub Pages
├── biome.json                 # Lint and format config
└── turbo.json                 # Turborepo pipeline
```

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/howlbox.svg?style=for-the-badge&logo=github)

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
