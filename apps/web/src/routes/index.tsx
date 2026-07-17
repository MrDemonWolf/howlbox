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
	Eyebrow,
	MONO,
	OBSSteps,
	PageBackground,
	SiteFooter,
	SiteHeader,
} from "@/components/landing/site-chrome";
import { ThemeWall } from "@/components/landing/theme-wall";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const FEATURES = [
	{
		icon: ShieldCheck,
		title: "No login, no keys",
		body: "Connects to Twitch chat anonymously. Nothing to authorize, nothing to leak, nothing to expire mid-stream.",
	},
	{
		icon: Palette,
		title: "Thirteen themes",
		body: "Wolf glass, Liquid Glass, CRT terminal, synthwave neon, Win95, pixel arcade, kawaii pastel, and more. All CSS-variable driven.",
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

const TRUST = ["MIT licensed", "13 themes", "No server, no accounts"];

function LandingPage() {
	return (
		<div className="dark min-h-svh scroll-smooth bg-[#040713] text-white antialiased">
			<PageBackground />

			<div className="relative z-10">
				<SiteHeader />

				<main>
					{/* hero */}
					<section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-20 pb-28 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="flex flex-col items-start gap-6">
							<div className="hb-reveal" style={{ animationDelay: "40ms" }}>
								<Eyebrow>Twitch chat overlay for OBS</Eyebrow>
							</div>
							<h1
								className={`hb-reveal text-balance font-bold text-6xl leading-[0.98] tracking-[-0.03em] lg:text-[5.5rem] ${DISPLAY_FONT}`}
								style={{ animationDelay: "120ms" }}
							>
								Your chat.
								<br />
								Your colors.
								<br />
								<span className="bg-gradient-to-r from-[#00ACED] to-[#7c5cff] bg-clip-text text-transparent">
									Your howl.
								</span>
							</h1>
							<p
								className="hb-reveal max-w-md text-pretty text-lg text-white/65 leading-relaxed"
								style={{ animationDelay: "220ms" }}
							>
								A themed chat overlay you host yourself. One self-contained URL,
								no login, no third-party overlay service standing between you
								and your chat.
							</p>

							{/* the whole config is one URL: say so, in the machine voice */}
							<div
								className="hb-reveal flex w-full max-w-md items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 px-3 py-2.5"
								style={{ animationDelay: "300ms" }}
							>
								<span className="size-2 shrink-0 rounded-full bg-[#00ACED] shadow-[0_0_8px_#00ACED]" />
								<code className="truncate font-mono text-[0.8rem] text-white/50">
									/overlay?channel=
									<span className="text-[#7fd7ff]">you</span>&theme=
									<span className="text-[#7fd7ff]">wolf</span>&bg=
									<span className="text-[#7fd7ff]">bubble</span>
								</code>
							</div>

							<div
								className="hb-reveal flex flex-wrap gap-3"
								style={{ animationDelay: "380ms" }}
							>
								<Link
									className="group inline-flex items-center gap-2 rounded-lg bg-[#00ACED] px-5 py-2.5 font-semibold text-[#04121f] transition-all hover:bg-[#33c1f5] hover:shadow-[0_8px_30px_rgb(0_172_237/0.4)]"
									to="/config"
								>
									Build your overlay
									<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
								</Link>
								<a
									className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold text-white/85 transition-colors hover:border-white/35 hover:text-white"
									href="https://github.com/mrdemonwolf/howlbox"
									rel="noreferrer"
									target="_blank"
								>
									Star on GitHub
								</a>
							</div>

							<div
								className={`hb-reveal flex flex-wrap gap-x-5 gap-y-2 text-[0.68rem] text-white/55 ${MONO}`}
								style={{ animationDelay: "460ms" }}
							>
								{TRUST.map((item) => (
									<span className="flex items-center gap-2" key={item}>
										<span className="size-1 rounded-full bg-[#00ACED]" />
										{item}
									</span>
								))}
							</div>
						</div>

						{/* floating, faintly tilted demo overlay */}
						<div
							className="hb-reveal lg:rotate-[1.4deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0"
							style={{ animationDelay: "260ms" }}
						>
							<DemoChat />
						</div>
					</section>

					{/* features as an editorial index */}
					<section className="mx-auto max-w-6xl px-6 py-24" id="features">
						<Eyebrow>Why it's different</Eyebrow>
						<h2
							className={`mt-5 mb-14 max-w-2xl text-balance font-bold text-4xl tracking-tight lg:text-5xl ${DISPLAY_FONT}`}
						>
							Built like a streamer actually needs it
						</h2>
						<div className="grid gap-x-12 sm:grid-cols-2">
							{FEATURES.map((feature, index) => (
								<div
									className="group flex gap-5 border-white/10 border-t py-7 transition-colors hover:border-[#00ACED]/40"
									key={feature.title}
								>
									<span className={`pt-1 text-[#00ACED]/70 text-xs ${MONO}`}>
										{String(index + 1).padStart(2, "0")}
									</span>
									<div>
										<h3 className="mb-2 flex items-center gap-2.5 font-semibold text-lg">
											<feature.icon className="size-5 text-[#00ACED]" />
											{feature.title}
										</h3>
										<p className="text-sm text-white/55 leading-relaxed">
											{feature.body}
										</p>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* theme wall */}
					<section className="mx-auto max-w-6xl px-6 py-24" id="themes">
						<Eyebrow>Thirteen themes</Eyebrow>
						<h2
							className={`mt-5 mb-4 max-w-2xl text-balance font-bold text-4xl tracking-tight lg:text-5xl ${DISPLAY_FONT}`}
						>
							Every theme is one query param
						</h2>
						<p className="mb-14 max-w-xl text-white/55 leading-relaxed">
							These are the real surfaces, rendered live. Preview any of them in
							the configurator, then pin your favorite with{" "}
							<code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[#7fd7ff] text-sm">
								?theme=
							</code>
							.
						</p>
						<ThemeWall />
					</section>

					{/* cta band */}
					<section className="mx-auto max-w-6xl px-6 py-16">
						<div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-[#00ACED]/25 bg-[radial-gradient(120%_140%_at_50%_-25%,rgb(0_172_237/0.2),transparent_68%)] px-6 py-20 text-center">
							<div className="relative flex flex-col items-center gap-6">
								<Eyebrow>Ninety seconds</Eyebrow>
								<h2
									className={`text-balance font-bold text-4xl tracking-tight lg:text-5xl ${DISPLAY_FONT}`}
								>
									Ready before your next scene change
								</h2>
								<p className="max-w-xl text-pretty text-white/65 leading-relaxed">
									Pick a theme, tweak a few options, copy the URL, drop it into
									an OBS browser source. That is the whole thing.
								</p>
								<Link
									className="group inline-flex items-center gap-2 rounded-lg bg-[#00ACED] px-6 py-3 font-semibold text-[#04121f] transition-all hover:bg-[#33c1f5] hover:shadow-[0_8px_30px_rgb(0_172_237/0.45)]"
									to="/config"
								>
									Open the configurator
									<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
								</Link>
							</div>
						</div>
					</section>

					<OBSSteps />
				</main>

				<SiteFooter />
			</div>

			<Toaster richColors />
		</div>
	);
}
