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

const TRUST = ["MIT licensed", "No account", "Runs on your host"];

// fact band: the numbers a self-hosting streamer actually shops on
const STATS = [
	{ value: "15", label: "themes" },
	{ value: "3", label: "display modes" },
	{ value: "4", label: "emote sources, merged per channel" },
	{ value: "0", label: "accounts, servers, or fees" },
];

const AUDIENCES = [
	{
		icon: Palette,
		title: "You want chat to match your scene",
		body: "Fifteen finished looks: wolf glass, Win95, Windows XP, Xbox, CRT terminal, synthwave, pixel arcade, kawaii pastel. Swap one with a query param.",
	},
	{
		icon: MonitorPlay,
		title: "You want the knobs",
		body: "Every element carries a stable hb-* class, so the OBS Custom CSS field reaches anything the parameters miss. Theme variables are overridable the same way, so you can keep a preset and change one color.",
	},
	{
		icon: ShieldCheck,
		title: "You do not want a third party",
		body: "Static files, no backend. Serve them from GitHub Pages, a home server, or a folder on the streaming box.",
	},
];

const SUPPORT = [
	{
		icon: Timer,
		title: "Moderation lands first",
		body: "Deletes, timeouts, and bans clear the overlay immediately. Set delay=10 and non-mod messages wait ten seconds before rendering, so a mod usually beats them to it.",
	},
	{
		icon: Zap,
		title: "Built for a browser source",
		body: "Transparent on the first paint, before React runs. No blur filters anywhere, which matters on CPU-rendered setups. Reconnects fire on visibility and network events rather than a timer, because OBS throttles timers in hidden sources.",
	},
	{
		icon: Smile,
		title: "Emotes from four places",
		body: "Twitch, 7TV (including zero-width overlays), BTTV, and FrankerFaceZ, resolved per channel and cached in your browser.",
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
		q: "What can it not do?",
		a: "Anything Twitch gates behind a token. It cannot send messages, time anyone out, read your mod queue, or see subs, follows, and bits, because those arrive over EventSub and EventSub needs an authenticated app. It also has no chat history: IRC gives you messages from the moment you connect, so an empty channel is an empty overlay.",
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
							{/* block spans rather than <br>: line breaks inside a
						    heading are announced as one run-on string */}
							<span className="block">The whole overlay</span>
							<span className="block">
								is <span className="hb-text-brand">one URL</span>
							</span>
						</h1>
						<p className="hb-reveal hb-text-2 max-w-md text-pretty text-lg leading-relaxed [animation-delay:220ms]">
							Paste it into an OBS browser source and you are done. HowlBox
							reads Twitch chat the way a logged-out viewer does, so there is no
							account, no OAuth app, and no server.
						</p>
						<p className="hb-reveal hb-text-2 max-w-md text-pretty leading-relaxed [animation-delay:250ms]">
							That cuts both ways. It can never post, ban, or read your mod
							queue.
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
								Build your URL
								<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
							</Link>
							<a
								className="hb-btn hb-btn-secondary"
								href={GITHUB_URL}
								rel="noreferrer"
								target="_blank"
							>
								Read the source
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
					sub="Three reasons people pick a self-hosted overlay over a hosted one."
					title="Three people this is for"
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
					sub="Rendered live, not screenshotted. Click one to open the builder with it selected."
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
					sub="Against a hosted overlay service, and against the chat dock OBS already ships."
					title="What you trade away"
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
					sub="Four things worth knowing before you paste a URL into your scene."
					title="Nothing to leak, because nothing is stored"
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
					{/* the brand line lands here, at the end, rather than standing
					    in for the headline the page actually needs up top */}
					<h2 className="hb-display text-balance text-4xl lg:text-5xl">
						Your chat. Your colors.{" "}
						<span className="hb-text-brand">Your howl.</span>
					</h2>
					<p className="hb-text-2 max-w-xl text-pretty leading-relaxed">
						Pick a theme in the builder, copy the URL it writes, paste it into a
						browser source.
					</p>
					<div className="flex flex-wrap justify-center gap-3">
						<Link className="hb-btn hb-btn-primary group" to="/config">
							Build your URL
							<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
						</Link>
						<Link className="hb-btn hb-btn-secondary" to="/docs">
							Read the parameter reference
						</Link>
					</div>
				</div>
			</Band>
		</SiteShell>
	);
}
