# Overlay performance benchmark

This standalone Playwright runner measures the built OBS overlay independently from the site E2E suite. It uses a local production export and a synthetic Twitch IRC stream, so each run gets the same message rate without joining a public channel.

## Run it

Build and serve the static production export from the repository root:

```sh
BASE_PATH=/ COMMIT_SHA=baseline bun run build
python3 -m http.server 4181 --bind 127.0.0.1 --directory apps/web/dist
```

In another terminal, run:

```sh
bun run bench:overlay
```

The runner rejects a Vite development page. It prints per-run measurements and medians. Optional environment settings:

```sh
OVERLAY_BENCH_REPEATS=1 OVERLAY_BENCH_DURATION_SCALE=0.1 bun run bench:overlay
OVERLAY_BENCH_PROFILE=1 bun run bench:overlay
OVERLAY_BENCH_SCREENSHOT=/tmp/howlbox-overlay.png bun run bench:overlay
OVERLAY_BENCH_URL=http://127.0.0.1:4281 bun run bench:overlay
```

Use the shortened duration for a smoke check only. CPU profiling adds sampling overhead, so do not compare profiled runs with the regular results. The screenshot is captured after the steady stack case.

The runner checks the mock IRC handshake, message cap, retained row count, and that the final stacked message's unique sequence marker has rendered before sampling CPU metrics. A short drain interval lets React commit the last update. Ticker mode must schedule at least one chat row. The output records the source commit and whether the worktree was dirty. Its `TaskDuration`, script, style recalculation, and layout values come from Chromium's [DevTools Protocol Performance domain](https://chromedevtools.github.io/devtools-protocol/tot/Performance/). It uses Playwright's [WebSocket routing API](https://playwright.dev/docs/api/class-page#page-route-web-socket) to feed the actual Twurple IRC parser.

## Baseline on 2026-10-10

The production export was built from `main` at `74d4193` with `BASE_PATH=/` and `COMMIT_SHA=baseline`. Three fresh browser contexts ran each scenario. Host: Apple M1 Pro, macOS arm64, Bun 1.4.2, Playwright 1.64.0, headless Chromium 156.0.8078.4. The repository currently declares Bun 1.3.14.

| Scenario | Stream and rows | Main-thread task time, median (range) | Script / style / layout, median | Retained JS heap after GC | DOM nodes |
| --- | --- | ---: | ---: | ---: | ---: |
| Idle | 0 messages for 10 s | 0.82 ms (0.79–2.15) | 0.06 / 0 / 0 ms | 2.61 MB | 99 |
| Steady stack | 12/s for 15 s, `max=50`, 50 rows | 510.87 ms (508.62–513.68) | 82.11 / 67.57 / 46.54 ms | 3.96 MB | 1,407 |
| High cap | 20/s for 12 s, `max=200`, 200 rows | 689.65 ms (682.85–761.30) | 105.11 / 71.70 / 93.23 ms | 4.40 MB | 2,446 |
| Ticker | 5/s for 15 s, `max=50`, 2 active rows at sample | 96.05 ms (95.28–106.46) | 35.27 / 13.62 / 9.85 ms | 3.68 MB | 850 |

As a fraction of one renderer main thread, the measured task time averages about 3.4% in the steady stack case, 5.7% at the high cap, and 0.6% in ticker mode. This is not whole-process CPU usage.

## Corrected-runner sample

The runner waits for a 750 ms render drain, verifies the final stacked message's unique sequence marker and an active ticker row, then samples metrics. Three fresh contexts on the dirty `74d4193` worktree produced these medians:

| Scenario | Main-thread task time, median (range) | Retained JS heap after GC |
| --- | ---: | ---: |
| Idle | 3.02 ms (1.16-3.31) | 2.61 MB |
| Steady stack | 748.45 ms (725.51-835.08) | 3.98 MB |
| High cap | 859.57 ms (847.19-873.12) | 4.42 MB |
| Ticker | 125.84 ms (116.96-126.99) | 3.71 MB |

These numbers are a corrected-harness validation, not a before-and-after comparison: the baseline above was sampled before the final-message drain. The text-only workload uses empty provider maps and does not trigger the periodic map refresh, so it cannot measure the refresh optimization below.

## Refresh optimization

Periodic emote and badge fetches now compare their returned maps with the maps already in memory. Identical results do not bump the media revision or re-resolve retained chat. When a changed map is refreshed, the resolver keeps message and media-array identities for rows whose visible parts and badges did not change. Focused tests cover equal maps, unrelated changes, changed or removed emotes, and changed or removed badges. This avoids unnecessary React row updates during refreshes; it is not a claim of lower CPU use during ordinary incoming chat.

## Measurement limits and tuning decisions

The benchmark uses repeated text messages and dynamic name colors. Emote and badge providers return empty payloads, and other third-party requests are blocked. The MrDemonWolf owner badge element is present, but its remote SVG is not downloaded. These numbers do not include media download, image decode, animation-heavy emotes, GPU/compositor work, total browser memory, or an OBS CEF process. No OBS process was running for this measurement. The JS heap is Chromium's page heap after forced collection; DOM node counts are reported separately.

I tested two runtime changes against the same connected mock and production browser. Adding `content-visibility: auto` to stacked rows raised median task time from 510.87 to 637.35 ms in the steady case and from 689.65 to 978.62 ms at `max=200`. Caching React row elements in a string-keyed map measured 667.58 ms steady, 708.60 ms at `max=200`, and 100.57 ms in ticker mode. Neither improved the matched baseline, and neither showed a useful or consistent retained-heap reduction, so both were removed. The existing message cap, memoized row component, and bounded moderation buffer remain in place.

The current result supports text-chat headroom on this headless Chromium host. Treat it as a repeatable local baseline, not an OBS hardware benchmark or a guarantee for image-heavy live channels.
