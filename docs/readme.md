# HowlBox Documentation - Live Reference and Contributor Guide

HowlBox is a client-only Twitch chat overlay for OBS browser sources. Its
Fumadocs site explains setup, URL settings, themes, custom badge art, styling
hooks, and the limits of anonymous chat.

Your chat. Your colors. Your howl.

## Features

- **URL reference** - Overlay settings, defaults, examples, and anchors
  for each parameter.
- **Theme guide** - Available themes and variants, with notes for OBS.
- **Custom badge art** - Inline and public gist formats, validation, and
  precedence.
- **Styling contract** - Stable `hb-*` classes and data attributes for
  OBS Custom CSS.
- **Troubleshooting** - Chat connection, missing emotes, and expected
  platform limits.

## Getting Started

Read the [live documentation](https://howlbox.mrdemonwolf.dev/docs/)
for the complete overlay reference. The
[project README](../README.md) covers the product, local setup, and the
short URL parameter table.

1. Install dependencies from the repository root:

   ```bash
   bun install
   ```

2. Start the web app:

   ```bash
   bun run dev:web
   ```

3. Open `http://localhost:3001/docs/` or use the builder at
   `http://localhost:3001/config/`.

## Usage

Use the configurator to create a URL, or start with this example:

```text
https://howlbox.mrdemonwolf.dev/overlay/?channel=mrdemonwolf&theme=wolf&bg=off
```

Add the URL as an OBS browser source and set the source dimensions there.
The connection is read-only anonymous Twitch chat. It cannot send or
moderate messages; follower alerts require a backend connection to
EventSub.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Docs site | Fumadocs MDX in `apps/docs/content/docs/` |
| Docs framework | Next.js static export with Orama search |
| Site and configurator | React 19, TanStack Router, and Vite |
| Language | TypeScript |
| Styling | Tailwind CSS 4 and CSS variables |
| Chat | `@twurple/chat` anonymous IRC |
| Hosting | GitHub Pages static site |

## Development

### Prerequisites

- Bun 1.3.14
- OBS Studio 31 or newer for browser source testing

### Setup

1. Install the workspace dependencies with `bun install`.
2. Run the site with `bun run dev:web` from the repository root.

### Development Scripts

- `bun run dev:web` - Start the site on port 3001 and proxy Fumadocs at `/docs/` from port 3002.
- `bun run check:ci` - Run Biome checks without applying fixes.
- `bun run check-types` - Check workspace types.
- `bun test` - Run unit tests.
- `bun run test:e2e` - Run the Playwright browser tests.
- `bun run ci` - Run format and lint checks, type checks, unit tests,
  build, and browser tests.

### Code Quality

- Keep TypeScript strict and use Biome for formatting and linting.
- Test overlay behavior with unit tests and Playwright.
- Keep the canonical parameter descriptions in
  `apps/docs/content/docs/url-reference.mdx` and the root README's short
  table in sync. Page titles, descriptions, and search keywords live in
  the MDX frontmatter.

## Project Structure

```text
howlbox/
├── apps/docs/content/docs/       # Live Fumadocs source pages
├── apps/docs/app/                # Static docs site and search index
├── apps/web/src/lib/overlay/     # URL schema, defaults, and builders
├── docs/readme.md                # This contributor guide
└── README.md                     # Project overview and quick start
```

The live `/docs/` site is generated from MDX in `apps/docs/content/docs/`.
This Markdown file is a repository guide, not a source page.

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/howlbox.svg?style=for-the-badge&logo=github)

## Contact

Have questions or feedback?

- Discord: [Join my server](https://mrdwolf.net/discord)

## Footer

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
