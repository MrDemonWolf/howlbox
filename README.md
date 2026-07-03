# HowlBox - Themed Twitch Chat Overlay for OBS

HowlBox is a self-hosted, client-only Twitch chat overlay for OBS
browser sources. It connects to Twitch chat anonymously (no login, no
OAuth, no secrets), renders native Twitch, 7TV, BTTV, and FFZ emotes,
and is configured entirely through URL query parameters so every OBS
source URL is self-contained. Built for streamers who want a modern
chat overlay without depending on third-party overlay services.

Your chat. Your colors. Your howl.

## Features

- **Anonymous chat connection** - Read-only Twitch chat over
  `@twurple/chat`, no account or API keys required.
- **Full emote support** - Native Twitch, 7TV, BTTV, and FFZ emotes,
  fetched and cached per channel.
- **Three display modes** - Transparent messages only (`bg=off`),
  themed backdrop panel (`bg=panel`), or per-message bubbles
  (`bg=bubble`).
- **Theme system** - CSS variable driven. Ships the wolf brand theme
  plus dark, light, and high-contrast neutrals.
- **URL-only configuration** - Every option is a query parameter. No
  config files, no dashboard, no state.
- **Generator page** - Pick options live at `/` and copy a ready OBS
  source URL.
- **Message controls** - Max messages, hide commands, hide bots,
  allow/hide lists, badges, timestamps, animations, and optional
  auto-hide after N seconds.
- **Static deploy anywhere** - GitHub Pages by default, or any static
  host such as Coolify.

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
   bun run dev
   ```

4. Open `http://localhost:3001` to use the generator, then add the
   generated URL as an OBS browser source.

## Usage

Build an overlay URL with the generator at `/`, or hand-write one:

```
/overlay?channel=mrdemonwolf&theme=wolf&bg=off
```

| Parameter  | Values                                   | Description                              |
| ---------- | ---------------------------------------- | ---------------------------------------- |
| `channel`  | Twitch login name                        | Channel to join (required)               |
| `theme`    | `wolf`, `glass`, `terminal`, `neon`, `dark`, `light`, `contrast`, `cozy`, `nobox`, `retro95`, `arcade`, `galaxy`, `mocha` | Color theme preset |
| `bg`       | `off`, `panel`, `bubble`                 | Display mode                             |
| `max`      | `1` to `200` (default `50`)              | Max messages kept on screen              |
| `hidebots` | flag                                     | Hide known chat bots (Nightbot, etc.)    |
| `hide`     | comma-separated logins                   | Always hide these users                  |
| `delay`    | seconds, `0` to `300` (default `0`)      | Hold non-mod messages so deletions land before display |

The full parameter reference (message limits, filters, badges,
timestamps, animations, auto-hide) is documented on the generator
page.

In OBS 31 or newer, add a Browser source with the generated URL and
set Width/Height on the source itself. Leave "Shutdown source when
not visible" and "Refresh browser when scene becomes active" off.

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React 19 + TanStack Router (Vite) |
| Language   | TypeScript (strict)               |
| Chat       | @twurple/chat (anonymous IRC)     |
| Styling    | Tailwind CSS 4 + CSS variables    |
| Monorepo   | Turborepo + Bun workspaces        |
| Linting    | Biome                             |
| Deploy     | GitHub Pages (static)             |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.3 or newer
- OBS Studio 31 or newer (for overlay testing)

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Run the dev server:

   ```bash
   bun run dev
   ```

### Development Scripts

- `bun run dev`: Start all apps in development mode
- `bun run dev:web`: Start only the web app
- `bun run build`: Build all apps
- `bun run check-types`: Check TypeScript types across the monorepo
- `bun run check`: Run Biome formatting and linting

### Code Quality

- TypeScript strict mode across every workspace
- Biome for linting and formatting
- Turborepo task caching for fast builds

## Project Structure

```
howlbox/
├── apps/
│   └── web/          # Overlay + generator app (React, TanStack Router)
├── packages/
│   ├── config/       # Shared tsconfig base
│   ├── env/          # Typed environment access
│   └── ui/           # Shared shadcn/ui components and styles
├── biome.json        # Lint and format config
└── turbo.json        # Turborepo pipeline
```

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/howlbox.svg?style=for-the-badge&logo=github)

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
