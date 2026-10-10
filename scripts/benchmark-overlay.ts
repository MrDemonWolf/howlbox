import { execFileSync } from "node:child_process";
import { arch, cpus, platform } from "node:os";
import {
	type CDPSession,
	chromium,
	type WebSocketRoute,
} from "@playwright/test";

const benchEnv = (name: string) => process.env[name];
const baseUrl = benchEnv("OVERLAY_BENCH_URL") ?? "http://127.0.0.1:4181";
const repeats = Math.max(1, Number(benchEnv("OVERLAY_BENCH_REPEATS") ?? 3));
const durationScale = Math.max(
	0.1,
	Number(benchEnv("OVERLAY_BENCH_DURATION_SCALE") ?? 1),
);
const profile = benchEnv("OVERLAY_BENCH_PROFILE") === "1";
const screenshotPath = benchEnv("OVERLAY_BENCH_SCREENSHOT");
const origin = new URL(baseUrl).origin;
const maxDefault = 50;
const sourceRevision = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
	encoding: "utf8",
}).trim();
const workingTreeDirty =
	execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
		.length > 0;

const scenarios = [
	{ name: "idle", rate: 0, seconds: 10, max: maxDefault, scroll: false },
	{
		name: "steady-stack",
		rate: 12,
		seconds: 15,
		max: maxDefault,
		scroll: false,
	},
	{ name: "high-cap", rate: 20, seconds: 12, max: 200, scroll: false },
	{ name: "ticker", rate: 5, seconds: 15, max: maxDefault, scroll: true },
] as const;

const chatters = [
	{ login: "moonhowler", name: "MoonHowler", color: "#1E90FF" },
	{ login: "lunathewolf", name: "LunaTheWolf", color: "#E5538D" },
	{ login: "packleader_dan", name: "PackLeader_Dan", color: "#44B84A" },
	{ login: "silverfang", name: "SilverFang", color: "#F5B700" },
	{ login: "nightpaws", name: "NightPaws", color: "#A98AE8" },
	{ login: "mrdemonwolf", name: "MrDemonWolf", color: "#00ACED" },
] as const;

const messageBodies = [
	"okay this overlay is clean",
	"wolf glass looks clean too",
	"the names are easy to pick out",
	"I can read chat without slowing down",
	"copy URL, paste in OBS, done",
] as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function messageBody(index: number): string {
	return `${messageBodies[index % messageBodies.length]} [${String(index).padStart(4, "0")}]`;
}

function providerBody(url: URL): unknown {
	if (url.hostname === "7tv.io") {
		return url.pathname.includes("/users/")
			? { emote_set: { emotes: [] } }
			: { emotes: [] };
	}
	if (url.hostname === "api.betterttv.net") {
		return url.pathname.includes("/users/")
			? { channelEmotes: [], sharedEmotes: [] }
			: [];
	}
	if (url.hostname === "api.frankerfacez.com") {
		return url.pathname.includes("/room/")
			? { room: { twitch_id: 1, set: 0 }, sets: {} }
			: { default_sets: [], sets: {} };
	}
	if (url.hostname === "api.ivr.fi") {
		return url.pathname.endsWith("/user") ? [{ id: "1" }] : [];
	}
	return undefined;
}

function ircMessage(index: number): string {
	const chatter = chatters[Math.floor(index / 3) % chatters.length];
	const body = messageBody(index);
	return (
		`@id=bench-${index};display-name=${chatter.name};color=${chatter.color};badges= ` +
		`:${chatter.login}!${chatter.login}@${chatter.login}.tmi.twitch.tv ` +
		`PRIVMSG #bench :${body}\r\n`
	);
}

function metricSet(metrics: Array<{ name: string; value: number }>) {
	return new Map(metrics.map(({ name, value }) => [name, value]));
}

async function getMetrics(cdp: CDPSession) {
	const { metrics } = (await cdp.send("Performance.getMetrics")) as {
		metrics: Array<{ name: string; value: number }>;
	};
	return metricSet(metrics);
}

function profileSummary(result: unknown) {
	const profile = (
		result as {
			profile?: {
				nodes?: Array<{
					id: number;
					callFrame: { functionName: string; url: string };
				}>;
				samples?: number[];
				timeDeltas?: number[];
			};
		}
	).profile;
	if (!profile?.nodes || !profile.samples || !profile.timeDeltas) {
		return [];
	}
	const nodes = new Map(profile.nodes.map((node) => [node.id, node.callFrame]));
	const times = new Map<number, number>();
	profile.samples.forEach((id, index) => {
		times.set(id, (times.get(id) ?? 0) + (profile.timeDeltas?.[index] ?? 0));
	});
	return [...times.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 12)
		.map(([id, microseconds]) => ({
			function: nodes.get(id)?.functionName || "(anonymous)",
			url: nodes.get(id)?.url,
			selfMs: Number((microseconds / 1000).toFixed(2)),
		}));
}

function percentile(values: number[], percent: number): number {
	const sorted = [...values].sort((a, b) => a - b);
	const index = Math.min(
		sorted.length - 1,
		Math.ceil(percent * sorted.length) - 1,
	);
	return sorted[index] ?? 0;
}

async function runOne(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	scenario: (typeof scenarios)[number],
	repetition: number,
) {
	const context = await browser.newContext({
		viewport: { width: 480, height: 800 },
		deviceScaleFactor: 1,
	});
	const page = await context.newPage();
	let socketRoute: WebSocketRoute | undefined;
	let resolveReady: (() => void) | undefined;
	let rejectReady: ((error: Error) => void) | undefined;
	let handshakeTimeout: ReturnType<typeof setTimeout> | undefined;
	const ready = new Promise<void>((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	await page.routeWebSocket("wss://**/*", (socket: WebSocketRoute) => {
		const url = new URL(socket.url());
		if (url.hostname !== "irc-ws.chat.twitch.tv") {
			socket.close({ code: 1000, reason: "benchmark only mocks Twitch IRC" });
			return;
		}
		socketRoute = socket;
		let nick = "justinfan000000";
		socket.onMessage((data) => {
			for (const line of String(data).split(/\r?\n/)) {
				if (/\bNICK\s+\S+/i.test(line)) {
					nick = line.match(/\bNICK\s+(\S+)/i)?.[1] ?? nick;
				}
				if (/^CAP\s+(?:\S+\s+)?LS(?:\s|$)/i.test(line)) {
					socket.send(
						":tmi.twitch.tv CAP * LS :twitch.tv/tags twitch.tv/commands\r\n",
					);
				} else if (/^CAP\s+(?:\S+\s+)?REQ\b/i.test(line)) {
					const capabilities =
						line.split(/\bREQ\s+:/i)[1] ?? "twitch.tv/tags twitch.tv/commands";
					socket.send(`:tmi.twitch.tv CAP * ACK :${capabilities.trim()}\r\n`);
				} else if (/^USER\s+/i.test(line)) {
					socket.send(
						`:tmi.twitch.tv 001 ${nick} :Welcome, benchmark client\r\n` +
							`:tmi.twitch.tv 376 ${nick} :End of /MOTD command\r\n`,
					);
					resolveReady?.();
				} else if (/^JOIN\s+#?\S+/i.test(line)) {
					const channel = line.match(/^JOIN\s+#?(\S+)/i)?.[1] ?? "bench";
					socket.send(
						`:${nick}!${nick}@benchmark.tmi.twitch.tv JOIN #${channel}\r\n` +
							`@room-id=1;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #${channel}\r\n`,
					);
				}
			}
		});
	});
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin === origin) {
			await route.continue();
			return;
		}
		const body = providerBody(url);
		if (body !== undefined) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(body),
			});
			return;
		}
		await route.abort();
	});

	const params = new URLSearchParams({
		channel: "bench",
		max: String(scenario.max),
		bg: "off",
		theme: "wolf",
		...(scenario.scroll ? { scroll: "ticker" } : {}),
	});
	try {
		handshakeTimeout = setTimeout(
			() => rejectReady?.(new Error("Mock Twitch IRC handshake timed out")),
			10_000,
		);
		const response = await page.goto(`${baseUrl}/overlay/?${params}`, {
			waitUntil: "domcontentloaded",
		});
		const html = await response?.text();
		if (
			!response?.ok() ||
			!html?.includes("/assets/") ||
			html.includes("/@vite/client") ||
			html.includes("@react-refresh")
		) {
			throw new Error("Benchmark URL must serve the built production overlay");
		}
		await ready;
		clearTimeout(handshakeTimeout);
		await page.locator(".hb-root").waitFor({ state: "visible" });
		await delay(2_000);
		if (await page.locator(".hb-status").count()) {
			throw new Error(
				"Mock Twitch IRC channel did not reach the connected state",
			);
		}
		const cdp = await context.newCDPSession(page);
		await cdp.send("Performance.enable");
		await cdp.send("HeapProfiler.enable");
		await cdp.send("HeapProfiler.collectGarbage");
		const before = await getMetrics(cdp);
		const start = performance.now();
		let sent = 0;
		if (profile) {
			await cdp.send("Profiler.enable");
			await cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
			await cdp.send("Profiler.start");
		}
		if (scenario.rate > 0 && socketRoute) {
			const interval = 1000 / scenario.rate;
			const timer = setInterval(() => {
				if (
					performance.now() - start >=
					scenario.seconds * durationScale * 1000
				) {
					clearInterval(timer);
					return;
				}
				socketRoute?.send(ircMessage(sent));
				sent++;
			}, interval);
			await delay(scenario.seconds * durationScale * 1000);
			clearInterval(timer);
		} else {
			await delay(scenario.seconds * durationScale * 1000);
		}
		const wallSeconds = (performance.now() - start) / 1000;
		await delay(750);
		const rows = page.locator(".hb-message");
		const renderedRows = await rows.count();
		const lastRow = renderedRows
			? await rows.last().evaluate((node) => {
					const rect = node.getBoundingClientRect();
					return {
						height: rect.height,
						top: rect.top,
						bottom: rect.bottom,
						contentVisibility: getComputedStyle(node).contentVisibility,
					};
				})
			: undefined;
		if (scenario.rate > 0 && !scenario.scroll && sent > 0) {
			const expectedBody = messageBody(sent - 1);
			const latestBody = await rows.last().locator(".hb-text").textContent();
			if (!latestBody?.includes(expectedBody)) {
				throw new Error(`${scenario.name} final IRC message did not render`);
			}
			if (
				!lastRow ||
				lastRow.height <= 0 ||
				lastRow.top >= 800 ||
				lastRow.bottom <= 0
			) {
				throw new Error(`${scenario.name} latest message row is not visible`);
			}
		}
		if (scenario.scroll) {
			const scheduledRows = await rows.evaluateAll(
				(nodes) =>
					nodes.filter((node) =>
						(node as HTMLElement).style.animation.includes("hb-ticker"),
					).length,
			);
			if (scheduledRows === 0) {
				throw new Error("Ticker scenario did not schedule an active chat row");
			}
		}
		const measured = await getMetrics(cdp);
		await cdp.send("HeapProfiler.collectGarbage");
		const retained = (await getMetrics(cdp)).get("JSHeapUsedSize") ?? 0;
		if (
			screenshotPath &&
			scenario.name === "steady-stack" &&
			repetition === 1
		) {
			await page.screenshot({ path: screenshotPath, fullPage: false });
		}
		const profileResult = profile
			? profileSummary(await cdp.send("Profiler.stop"))
			: undefined;
		const result = {
			scenario: scenario.name,
			repetition,
			requestedRatePerSecond: scenario.rate,
			actualRatePerSecond: Number((sent / wallSeconds).toFixed(2)),
			messagesSent: sent,
			rowsRetained: renderedRows,
			lastRowContentVisibility: lastRow?.contentVisibility,
			wallSeconds: Number(wallSeconds.toFixed(2)),
			mainThreadTaskMs: Number(
				(
					((measured.get("TaskDuration") ?? 0) -
						(before.get("TaskDuration") ?? 0)) *
					1000
				).toFixed(2),
			),
			scriptMs: Number(
				(
					((measured.get("ScriptDuration") ?? 0) -
						(before.get("ScriptDuration") ?? 0)) *
					1000
				).toFixed(2),
			),
			styleMs: Number(
				(
					((measured.get("RecalcStyleDuration") ?? 0) -
						(before.get("RecalcStyleDuration") ?? 0)) *
					1000
				).toFixed(2),
			),
			layoutMs: Number(
				(
					((measured.get("LayoutDuration") ?? 0) -
						(before.get("LayoutDuration") ?? 0)) *
					1000
				).toFixed(2),
			),
			retainedJsHeapBytesAfterGc: retained,
			domNodes: measured.get("Nodes") ?? 0,
			profile: profileResult,
		};
		if (
			scenario.rate > 0 &&
			!scenario.scroll &&
			renderedRows !== Math.min(sent, scenario.max)
		) {
			throw new Error(
				`${scenario.name} rendered ${renderedRows} rows for ${sent} sent messages (max ${scenario.max})`,
			);
		}
		await cdp.detach();
		return result;
	} finally {
		if (handshakeTimeout) {
			clearTimeout(handshakeTimeout);
		}
		await context.close();
	}
}

async function main() {
	const browser = await chromium.launch({ headless: true });
	const results: Awaited<ReturnType<typeof runOne>>[] = [];
	try {
		for (const scenario of scenarios) {
			for (let repetition = 1; repetition <= repeats; repetition++) {
				results.push(await runOne(browser, scenario, repetition));
			}
		}
	} finally {
		await browser.close();
	}
	const summary = scenarios.map(({ name }) => {
		const rows = results.filter((result) => result.scenario === name);
		const values = (key: keyof (typeof rows)[number]) =>
			rows.map((row) => Number(row[key] ?? 0));
		const taskTimes = values("mainThreadTaskMs");
		return {
			scenario: name,
			repetitions: rows.length,
			medianMainThreadTaskMs: percentile(taskTimes, 0.5),
			minMainThreadTaskMs: Math.min(...taskTimes),
			maxMainThreadTaskMs: Math.max(...taskTimes),
			medianScriptMs: percentile(values("scriptMs"), 0.5),
			medianStyleMs: percentile(values("styleMs"), 0.5),
			medianLayoutMs: percentile(values("layoutMs"), 0.5),
			medianRetainedJsHeapBytes: percentile(
				values("retainedJsHeapBytesAfterGc"),
				0.5,
			),
			medianDomNodes: percentile(values("domNodes"), 0.5),
		};
	});
	console.log(
		JSON.stringify(
			{
				metadata: {
					sourceRevision,
					workingTreeDirty,
					baseUrl,
					buildMode: "static production build",
					browser: browser.version(),
					platform: `${platform()} ${arch()}`,
					cpu: cpus()[0]?.model,
					logicalCpuCount: cpus().length,
					viewport: "480x800 @ 1x",
					repeats,
					durationScale,
					profile,
				},
				results,
				summary,
			},
			null,
			2,
		),
	);
}

await main();
