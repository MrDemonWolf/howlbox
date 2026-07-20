import { Toaster } from "@howlbox/ui/components/sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	MonitorPlay,
	Palette,
	ShieldCheck,
	Smile,
	Timer,
	Zap,
} from "lucide-react";

import { DemoChat } from "@/components/landing/demo-chat";
import {
	DISPLAY_FONT,
	MONO,
	OBSSteps,
	PageBackground,
	SectionHead,
	SiteFooter,
	SiteHeader,
} from "@/components/landing/site-chrome";
import { ThemeWall } from "@/components/landing/theme-wall";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

const FEATURES = [
	{
		icon: ShieldCheck,
		title: "No login, no keys",
		body: "Connects to Twitch chat anonymously. Nothing to authorize, nothing to leak, nothing to expire mid-stream.",
	},
	{
		icon: Palette,
		title: "Fifteen themes",
		body: "Wolf glass, Liquid Glass, CRT terminal, synthwave neon, Win95, Windows XP, Xbox, pixel arcade, kawaii pastel, and more. All CSS-variable driven.",
	},
	{
		icon: MonitorPlay,
		title: "Three display modes",
		body: "Transparent text over gameplay, one themed backdrop panel, or per-message bubbles. One URL parameter.",
	},
	{
		icon: Smile,
		title: "Every emote",
		body: "Native Twitch emotes plus 7TV, BTTV, and FrankerFaceZ, resolved per channel and cached.",
	},
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
];

const TRUST = ["Free forever", "MIT open source", "No account, no keys"];

// fact band: the numbers a self-hosting streamer actually shops on
const STATS = [
	{ value: "15", label: "themes, one query param each" },
	{ value: "3", label: "display modes: text, panel, bubble" },
	{ value: "4", label: "emote platforms, merged per channel" },
	{ value: "0", label: "accounts, servers, or fees" },
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

function LandingPage() {
	return (
		<div className="dark min-h-svh scroll-smooth bg-[#040713] text-white antialiased">
			<PageBackground />

			<div className="relative z-10">
				<SiteHeader />

				<main>
					{/* hero */}
					<section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-20 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24">
						<div className="flex flex-col items-start gap-6">
							<p
								className={`hb-reveal text-[#7fd7ff] text-xs [animation-delay:40ms] ${MONO}`}
							>
								Twitch chat overlay for OBS
							</p>
							<h1
								className={`hb-reveal text-balance font-bold text-6xl leading-[0.98] tracking-[-0.03em] [animation-delay:120ms] lg:text-[5.5rem] ${DISPLAY_FONT}`}
							>
								Your chat.
								<br />
								Your colors.
								<br />
								<span className="bg-gradient-to-r from-[#00ACED] to-[#7c5cff] bg-clip-text text-transparent">
									Your howl.
								</span>
							</h1>
							<p className="hb-reveal max-w-md text-pretty text-[color:var(--site-txt-2)] text-lg leading-relaxed [animation-delay:220ms]">
								A themed chat overlay you host yourself. One self-contained URL,
								no login, no third-party overlay service standing between you
								and your chat.
							</p>

							{/* the whole config is one URL: say so, in the machine voice */}
							<div className="hb-reveal flex w-full max-w-md items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 [animation-delay:300ms]">
								<span className="size-2 shrink-0 rounded-full bg-[#00ACED] shadow-[0_0_8px_#00ACED]" />
								<code className="truncate font-mono text-[0.8rem] text-white/50">
									/overlay?channel=
									<span className="text-[#7fd7ff]">you</span>&theme=
									<span className="text-[#7fd7ff]">wolf</span>&bg=
									<span className="text-[#7fd7ff]">bubble</span>
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
										<span className="size-1.5 rounded-full bg-[#00ACED]" />
										{item}
									</span>
								))}
							</div>
						</div>

						{/* floating, faintly tilted demo overlay */}
						<div className="hb-reveal [animation-delay:260ms] lg:rotate-[1.4deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0">
							<DemoChat />
						</div>
					</section>

					{/* 01 fact band: scannable numbers, no marketese */}
					<section className="mx-auto max-w-6xl px-6 py-16">
						<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
							{STATS.map((stat) => (
								<div className="hb-card px-6 py-6" key={stat.label}>
									<dd
										className={`order-first font-bold text-4xl text-white tracking-tight ${DISPLAY_FONT}`}
									>
										{stat.value}
									</dd>
									<dt
										className={`mt-2 text-[0.68rem] text-[color:var(--site-txt-2)] ${MONO}`}
									>
										{stat.label}
									</dt>
								</div>
							))}
						</dl>
					</section>

					{/* 02 features */}
					<section className="mx-auto max-w-6xl px-6 py-20" id="features">
						<SectionHead
							align="center"
							index="01"
							kicker="Why it's different"
							sub="Every choice here is the one a streamer would make, not the one a SaaS dashboard would."
							title="Built like a streamer actually needs it"
						/>
						<div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map((feature) => (
								<div
									className="hb-card p-6 transition-colors hover:border-[#00ACED]/40"
									key={feature.title}
								>
									<feature.icon className="size-5 text-[#00ACED]" />
									<h3 className="mt-4 mb-2 font-semibold text-lg">
										{feature.title}
									</h3>
									<p className="text-[color:var(--site-txt-2)] text-sm leading-relaxed">
										{feature.body}
									</p>
								</div>
							))}
						</div>
					</section>

					{/* 03 theme wall */}
					<section className="mx-auto max-w-6xl px-6 py-20" id="themes">
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
					</section>

					{/* 04 setup */}
					<OBSSteps index="03" />

					{/* 05 faq */}
					<section className="mx-auto max-w-3xl px-6 py-20">
						<SectionHead
							align="center"
							index="04"
							kicker="Questions"
							title="The things people ask first"
						/>
						<div className="mt-12 flex flex-col gap-3">
							{FAQ.map((item) => (
								<details className="hb-card group p-6" key={item.q}>
									<summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-base">
										{item.q}
										<span
											aria-hidden
											className="text-2xl text-[color:var(--site-txt-2)] leading-none transition-transform group-open:rotate-45"
										>
											+
										</span>
									</summary>
									<p className="mt-4 text-[color:var(--site-txt-2)] leading-relaxed">
										{item.a}
									</p>
								</details>
							))}
						</div>
					</section>

					{/* cta band */}
					<section className="mx-auto max-w-6xl px-6 py-16">
						<div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-[#00ACED]/25 bg-[radial-gradient(120%_140%_at_50%_-25%,rgb(0_172_237/0.2),transparent_68%)] px-6 py-20 text-center">
							<h2
								className={`text-balance font-bold text-4xl tracking-tight lg:text-5xl ${DISPLAY_FONT}`}
							>
								Live in about ninety seconds
							</h2>
							<p className="max-w-xl text-pretty text-[color:var(--site-txt-2)] leading-relaxed">
								Pick a theme, copy the URL, paste it into an OBS browser source.
								No account, no fee, no watermark. That is the whole thing.
							</p>
							<Link className="hb-btn hb-btn-primary group" to="/config">
								Open the configurator
								<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</div>
					</section>
				</main>

				<SiteFooter />
			</div>

			<Toaster richColors />
		</div>
	);
}
