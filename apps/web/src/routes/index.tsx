import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	Minus,
	MonitorPlay,
	Palette,
	ShieldCheck,
	Smile,
	Timer,
	Zap,
} from "lucide-react";

import { DemoChat } from "@/components/landing/demo-chat";
import { OverlayPreview } from "@/components/landing/overlay-preview";
import {
	Band,
	MONO,
	OBSSteps,
	SectionHead,
	SiteShell,
} from "@/components/landing/site-chrome";
import { ThemeWall } from "@/components/landing/theme-wall";
import type { BgMode } from "@/lib/overlay/params";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

const TRUST = ["Free forever", "MIT open source", "No account, no keys"];

// fact band: the numbers a self-hosting streamer actually shops on
const STATS = [
	{ value: "15", label: "themes, one query param each" },
	{ value: "3", label: "display modes: text, panel, bubble" },
	{ value: "4", label: "emote platforms, merged per channel" },
	{ value: "0", label: "accounts, servers, or fees" },
];

const AUDIENCES = [
	{
		icon: Palette,
		title: "Streamers who want it to match",
		body: "Fifteen finished looks, from wolf glass to Win95 to pixel arcade. Pick one, and chat stops looking like a stock widget bolted onto your scene.",
	},
	{
		icon: MonitorPlay,
		title: "Tinkerers who want the knobs",
		body: "Every node carries a stable hb-* class, so the OBS Custom CSS field is a real escape hatch. Change anything the params do not cover.",
	},
	{
		icon: ShieldCheck,
		title: "Self-hosters who want no third party",
		body: "A static client-only site with no backend. Serve it from GitHub Pages or a home server; nothing about your chat leaves your machine except the anonymous Twitch connection.",
	},
];

const SUPPORT = [
	{
		icon: Timer,
		title: "Mod-friendly",
		body: "Deleted messages, timeouts, and bans vanish instantly. An optional delay holds non-mod messages so moderation lands first.",
	},
	{
		icon: Zap,
		title: "OBS-optimized",
		body: "Transparent from first paint, zero blur filters, event-driven reconnects that survive hidden-source throttling.",
	},
	{
		icon: Smile,
		title: "Every emote",
		body: "Native Twitch emotes plus 7TV, BTTV, and FrankerFaceZ, resolved per channel and cached.",
	},
];

const MODES: { bg: BgMode; title: string; body: string }[] = [
	{
		bg: "off",
		title: "Text",
		body: "Bare messages over gameplay, outlined so they stay readable on any frame.",
	},
	{
		bg: "panel",
		title: "Panel",
		body: "One themed backdrop behind the column. It only draws while there are messages, so a quiet channel shows nothing.",
	},
	{
		bg: "bubble",
		title: "Bubble",
		body: "A themed surface per message. Busiest look, best legibility over bright video.",
	},
];

const COMPARE_COLUMNS = [
	"HowlBox",
	"Hosted overlay service",
	"OBS Twitch dock",
];

const COMPARISON: { row: string; cells: (boolean | string)[] }[] = [
	{ row: "Account or OAuth required", cells: [false, true, true] },
	{ row: "Config travels in the URL", cells: [true, false, false] },
	{ row: "7TV, BTTV, and FFZ emotes", cells: [true, "Sometimes", false] },
	{ row: "Themeable without CSS work", cells: [true, true, false] },
	{ row: "Custom CSS escape hatch", cells: [true, "Sometimes", false] },
	{ row: "Runs on your own host", cells: [true, false, false] },
	{ row: "Cost", cells: ["Free", "Free tier or paid", "Free"] },
];

const FAQ = [
	{
		q: "Do I need to log in or connect my Twitch account?",
		a: "No. HowlBox reads chat over anonymous Twitch IRC, the same way a logged-out viewer does. There is no OAuth step, no token to expire mid-stream, and nothing stored on a server.",
	},
	{
		q: "Where is my configuration saved?",
		a: "In the URL itself. Every option is a query parameter, so the link in your OBS browser source is your entire setup. Copy it to another machine and you have the same overlay.",
	},
	{
		q: "Can I edit an overlay I already set up?",
		a: "Yes. Paste the existing URL into the box at the top of the configurator and every control loads with your current settings, ready to change.",
	},
	{
		q: "Does the panel sit on my stream when chat is quiet?",
		a: "No. The panel backdrop only draws while there are messages to hold, so a silent channel shows nothing at all instead of an empty themed rectangle.",
	},
	{
		q: "Can I host it myself?",
		a: "That is the point. It is a static client-only site with no backend. Serve the build from GitHub Pages, a home server, or any static host, and nothing about your chat leaves your machine except the anonymous Twitch connection.",
	},
];

function ComparisonCell({ value }: { value: boolean | string }) {
	if (value === true) {
		return (
			<>
				<Check
					aria-hidden
					className="mx-auto size-4 text-[color:var(--site-brand-text)]"
				/>
				<span className="sr-only">Yes</span>
			</>
		);
	}
	if (value === false) {
		return (
			<>
				<Minus aria-hidden className="hb-text-2 mx-auto size-4" />
				<span className="sr-only">No</span>
			</>
		);
	}
	return <span className="hb-text-2 text-sm">{value}</span>;
}

function LandingPage() {
	return (
		<SiteShell>
			{/* hero */}
			<section className="hb-bg-base">
				<div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-24">
					{/* min-w-0: grid items default to min-width:auto, so the demo
					    column's min-content width pushes the page wider than the
					    viewport on small screens */}
					<div className="flex min-w-0 flex-col items-start gap-6">
						<p
							className={`hb-reveal hb-text-brand text-xs [animation-delay:40ms] ${MONO}`}
						>
							Twitch chat overlay for OBS
						</p>
						<h1 className="hb-reveal hb-display text-balance text-5xl [animation-delay:120ms] lg:text-7xl">
							Your chat.
							<br />
							Your colors.
							<br />
							<span className="hb-text-brand">Your howl.</span>
						</h1>
						<p className="hb-reveal hb-text-2 max-w-md text-pretty text-lg leading-relaxed [animation-delay:220ms]">
							A themed chat overlay you host yourself. One self-contained URL,
							no login, no third-party overlay service standing between you and
							your chat.
						</p>

						{/* the whole config is one URL: say so, in the machine voice */}
						<div className="hb-reveal hb-card flex w-full max-w-md items-center gap-2 overflow-hidden px-3 py-2.5 [animation-delay:300ms]">
							<span className="size-2 shrink-0 rounded-full bg-[color:var(--site-brand)]" />
							<code className="hb-text-2 truncate font-mono text-[0.8rem]">
								/overlay?channel=
								<span className="hb-text-brand">you</span>&theme=
								<span className="hb-text-brand">wolf</span>&bg=
								<span className="hb-text-brand">bubble</span>
							</code>
						</div>

						<div className="hb-reveal flex flex-wrap gap-3 [animation-delay:380ms]">
							<Link className="hb-btn hb-btn-primary group" to="/config">
								Build your overlay
								<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
							</Link>
							<a
								className="hb-btn hb-btn-secondary"
								href={GITHUB_URL}
								rel="noreferrer"
								target="_blank"
							>
								Star on GitHub
							</a>
						</div>

						<div className="hb-reveal flex flex-wrap gap-2 [animation-delay:460ms]">
							{TRUST.map((item) => (
								<span className="hb-pill" key={item}>
									<span className="size-1.5 rounded-full bg-[color:var(--site-brand)]" />
									{item}
								</span>
							))}
						</div>
					</div>

					<div className="hb-reveal min-w-0 [animation-delay:260ms]">
						<DemoChat />
					</div>
				</div>

				{/* fact strip, hairline-separated inside the hero band */}
				<div className="mx-auto max-w-6xl px-6 pb-16">
					<dl className="hb-hairline grid grid-cols-2 gap-8 border-t pt-10 lg:grid-cols-4">
						{STATS.map((stat) => (
							<div key={stat.label}>
								<dd className="hb-display order-first text-4xl">
									{stat.value}
								</dd>
								<dt className="hb-text-2 mt-2 text-sm leading-snug">
									{stat.label}
								</dt>
							</div>
						))}
					</dl>
				</div>
			</section>

			{/* 01 who it's for */}
			<Band id="audiences" tone="surface">
				<SectionHead
					align="center"
					index="01"
					kicker="Who it's for"
					sub="Every choice here is the one a streamer would make, not the one a SaaS dashboard would."
					title="Built like a streamer actually needs it"
				/>
				<div className="mt-14 grid gap-4 lg:grid-cols-3">
					{AUDIENCES.map((item) => (
						<div className="hb-card p-6" key={item.title}>
							<item.icon className="size-5 text-[color:var(--site-brand-text)]" />
							<h3 className="mt-4 mb-2 font-semibold text-lg">{item.title}</h3>
							<p className="hb-text-2 text-sm leading-relaxed">{item.body}</p>
						</div>
					))}
				</div>
				<div className="hb-hairline mt-10 grid gap-8 border-t pt-10 sm:grid-cols-3">
					{SUPPORT.map((item) => (
						<div key={item.title}>
							<item.icon className="size-4 text-[color:var(--site-brand-text)]" />
							<h3 className="mt-3 mb-1.5 font-semibold text-base">
								{item.title}
							</h3>
							<p className="hb-text-2 text-sm leading-relaxed">{item.body}</p>
						</div>
					))}
				</div>
			</Band>

			{/* 02 themes */}
			<Band id="themes" tone="base">
				<SectionHead
					align="center"
					index="02"
					kicker="Fifteen themes"
					sub="These are the real surfaces, rendered live. Preview any of them in the configurator, then pin your favorite."
					title="Every theme is one query param"
				/>
				<div className="mt-14">
					<ThemeWall />
				</div>
			</Band>

			{/* 03 display modes */}
			<Band id="modes" tone="surface">
				<SectionHead
					align="center"
					index="03"
					kicker="Display modes"
					sub="The same chat, three ways to sit on your scene. One parameter switches between them."
					title="Text, panel, or bubble"
				/>
				<div className="mt-14 grid gap-6 lg:grid-cols-3">
					{MODES.map((mode) => (
						<div className="flex flex-col gap-3" key={mode.bg}>
							<OverlayPreview
								animate
								bg={mode.bg}
								className="h-80"
								fadeSeconds={0}
								showBadges={false}
								showTimestamps={false}
								theme="wolf"
							/>
							<div>
								<h3 className="font-semibold text-base">
									{mode.title}{" "}
									<code className="hb-text-2 font-mono text-xs">
										?bg={mode.bg}
									</code>
								</h3>
								<p className="hb-text-2 mt-1 text-sm leading-relaxed">
									{mode.body}
								</p>
							</div>
						</div>
					))}
				</div>
			</Band>

			{/* 04 comparison */}
			<Band id="compare" tone="base">
				<SectionHead
					align="center"
					index="04"
					kicker="How it compares"
					sub="Against a hosted overlay service and against the chat dock OBS already gives you."
					title="What you give up, and what you don't"
				/>
				<div className="hb-card mt-14 overflow-x-auto">
					<table className="w-full min-w-[36rem] border-collapse text-left">
						<thead>
							<tr className="hb-hairline border-b">
								<th className="p-4 font-semibold text-sm" scope="col">
									<span className="sr-only">Capability</span>
								</th>
								{COMPARE_COLUMNS.map((column) => (
									<th
										className={`p-4 text-center font-semibold text-sm ${column === "HowlBox" ? "hb-text-brand" : ""}`}
										key={column}
										scope="col"
									>
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{COMPARISON.map((entry) => (
								<tr
									className="hb-hairline border-b last:border-b-0"
									key={entry.row}
								>
									<th className="hb-text-2 p-4 font-medium text-sm" scope="row">
										{entry.row}
									</th>
									{entry.cells.map((cell, cellIndex) => (
										<td
											className="p-4 text-center"
											key={`${entry.row}-${COMPARE_COLUMNS[cellIndex]}`}
										>
											<ComparisonCell value={cell} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Band>

			{/* 05 setup */}
			<OBSSteps index="05" tone="surface" />

			{/* 06 privacy */}
			<Band id="privacy" tone="base">
				<SectionHead
					index="06"
					kicker="Privacy"
					sub="There is no server to trust, because there is no server."
					title="Nothing to leak"
				/>
				<ul className="hb-text-2 mt-10 grid gap-4 sm:grid-cols-2">
					{[
						"Chat is read over anonymous Twitch IRC. No OAuth, no token, no account.",
						"Your configuration lives in the URL, not in a database.",
						"Emote and badge art is fetched straight from 7TV, BTTV, FFZ, and ivr.fi, and cached in your own browser.",
						"No analytics, no telemetry, no cookies set by HowlBox.",
					].map((item) => (
						<li
							className="hb-card flex gap-3 p-5 text-sm leading-relaxed"
							key={item}
						>
							<Check
								aria-hidden
								className="mt-0.5 size-4 shrink-0 text-[color:var(--site-brand-text)]"
							/>
							{item}
						</li>
					))}
				</ul>
				<Link className="hb-btn hb-btn-secondary mt-8" to="/privacy">
					Read the privacy policy
				</Link>
			</Band>

			{/* 07 faq */}
			<Band tone="surface">
				<div className="mx-auto max-w-3xl">
					<SectionHead
						align="center"
						index="07"
						kicker="Questions"
						title="The things people ask first"
					/>
					<div className="mt-12 flex flex-col gap-3">
						{FAQ.map((item) => (
							<details className="hb-card group p-6" key={item.q}>
								{/* the question is an h3 so it joins the document
								    outline; a bare <summary> never does */}
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4">
									<h3 className="font-semibold text-base">{item.q}</h3>
									<span
										aria-hidden
										className="hb-text-2 text-2xl leading-none transition-transform group-open:rotate-45"
									>
										+
									</span>
								</summary>
								<p className="hb-text-2 mt-4 leading-relaxed">{item.a}</p>
							</details>
						))}
					</div>
				</div>
			</Band>

			{/* cta */}
			<Band tone="base">
				<div className="hb-card flex flex-col items-center gap-6 px-6 py-20 text-center">
					<h2 className="hb-display text-balance text-4xl lg:text-5xl">
						Live in about ninety seconds
					</h2>
					<p className="hb-text-2 max-w-xl text-pretty leading-relaxed">
						Pick a theme, copy the URL, paste it into an OBS browser source. No
						account, no fee, no watermark. That is the whole thing.
					</p>
					<Link className="hb-btn hb-btn-primary group" to="/config">
						Open the configurator
						<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
					</Link>
				</div>
			</Band>
		</SiteShell>
	);
}
