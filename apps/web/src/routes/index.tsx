import { Toaster } from "@howlbox/ui/components/sonner";
import { createFileRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
	MonitorPlay,
	Palette,
	PawPrint,
	ShieldCheck,
	Smile,
	Timer,
	Zap,
} from "lucide-react";

import { DemoChat } from "@/components/landing/demo-chat";
import { Generator } from "@/components/landing/generator";

import "@fontsource-variable/bricolage-grotesque/index.css";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const DISPLAY_FONT =
	"[font-family:'Bricolage_Grotesque_Variable',system-ui,sans-serif]";

const FEATURES = [
	{
		icon: ShieldCheck,
		title: "No login, no keys",
		body: "Connects to Twitch chat anonymously. Nothing to authorize, nothing to leak, nothing to expire mid-stream.",
	},
	{
		icon: Palette,
		title: "13 themes",
		body: "Wolf glass, macOS-style Liquid Glass, CRT terminal, synthwave neon, Win95, pixel arcade, kawaii pastel, and more. All CSS-variable driven.",
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
		body: "Deleted messages, timeouts, and bans vanish from the overlay instantly. Optional delay holds non-mod messages so moderation lands first.",
	},
	{
		icon: Zap,
		title: "OBS-optimized",
		body: "Transparent from first paint, zero blur filters, event-driven reconnects that survive hidden-source throttling. Safe on CPU-rendered setups.",
	},
];

const SETUP_STEPS = [
	{
		title: "Build your URL",
		body: "Pick a theme and mode in the generator below, then copy the URL.",
	},
	{
		title: "Add a Browser source",
		body: "In OBS: Sources, plus, Browser. Paste the URL.",
	},
	{
		title: "Size it on the source",
		body: "Set Width and Height in the source properties (try 480 x 800). Don't stretch with the transform handles, that blurs.",
	},
	{
		title: "Leave both checkboxes off",
		body: '"Shutdown source when not visible" and "Refresh browser when scene becomes active" both fight a live chat feed.',
	},
];

function LandingPage() {
	return (
		<div className="dark min-h-svh scroll-smooth bg-[#050a1a] text-white antialiased">
			{/* atmosphere: deep-space gradient + cerulean glow + star grain */}
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#0c1f4a_0%,#091533_45%,#050a1a_100%)]" />
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(45%_35%_at_75%_8%,rgb(0_172_237/0.14),transparent_70%)]" />

			<div className="relative">
				<header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
					<a
						className={`flex items-center gap-2 font-bold text-lg ${DISPLAY_FONT}`}
						href="/"
					>
						<PawPrint className="size-5 text-[#00ACED]" />
						HowlBox
					</a>
					<nav className="flex items-center gap-5 text-sm text-white/70 max-sm:gap-3 [&>a:not(:last-child)]:max-sm:hidden">
						<a className="hover:text-white" href="#features">
							Features
						</a>
						<a className="hover:text-white" href="#generator">
							Generator
						</a>
						<a className="hover:text-white" href="#setup">
							Setup
						</a>
						<a
							className="rounded-md border border-white/15 px-3 py-1.5 hover:border-white/35 hover:text-white"
							href="https://github.com/mrdemonwolf/howlbox"
							rel="noreferrer"
							target="_blank"
						>
							GitHub
						</a>
					</nav>
				</header>

				<main>
					{/* hero */}
					<section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr]">
						<div className="flex flex-col items-start gap-6">
							<span className="rounded-full border border-[#00ACED]/40 bg-[#00ACED]/10 px-3 py-1 font-medium text-[#7fd7ff] text-xs">
								Self-hosted. Open source. Zero accounts.
							</span>
							<h1
								className={`text-balance font-bold text-5xl leading-[1.05] tracking-tight lg:text-6xl ${DISPLAY_FONT}`}
							>
								Your chat.
								<br />
								Your colors.
								<br />
								<span className="text-[#00ACED]">Your howl.</span>
							</h1>
							<p className="max-w-md text-pretty text-lg text-white/70">
								A themed Twitch chat overlay for OBS. One self-contained URL, no
								login, no third-party overlay service between you and your chat.
							</p>
							<div className="flex gap-3">
								<a
									className="rounded-lg bg-[#00ACED] px-5 py-2.5 font-semibold text-[#04121f] transition-colors hover:bg-[#33c1f5]"
									href="#generator"
								>
									Build your overlay
								</a>
								<a
									className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold text-white/85 transition-colors hover:border-white/35"
									href="https://github.com/mrdemonwolf/howlbox"
									rel="noreferrer"
									target="_blank"
								>
									Star on GitHub
								</a>
							</div>
						</div>
						<DemoChat />
					</section>

					{/* features */}
					<section className="mx-auto max-w-6xl px-6 py-16" id="features">
						<h2
							className={`mb-10 font-bold text-3xl tracking-tight ${DISPLAY_FONT}`}
						>
							Built like a streamer needs it
						</h2>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map((feature) => (
								<div
									className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-[#00ACED]/40"
									key={feature.title}
								>
									<feature.icon className="mb-4 size-6 text-[#00ACED]" />
									<h3 className="mb-2 font-semibold">{feature.title}</h3>
									<p className="text-sm text-white/60 leading-relaxed">
										{feature.body}
									</p>
								</div>
							))}
						</div>
					</section>

					{/* generator */}
					<section className="mx-auto max-w-6xl px-6 py-16" id="generator">
						<h2
							className={`mb-2 font-bold text-3xl tracking-tight ${DISPLAY_FONT}`}
						>
							Build your overlay URL
						</h2>
						<p className="mb-10 text-white/60">
							Everything is a URL parameter. The link below is your entire
							setup.
						</p>
						<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm lg:p-8">
							<Generator />
						</div>
					</section>

					{/* setup steps */}
					<section className="mx-auto max-w-6xl px-6 py-16" id="setup">
						<h2
							className={`mb-10 font-bold text-3xl tracking-tight ${DISPLAY_FONT}`}
						>
							Into OBS in four steps
						</h2>
						<ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{SETUP_STEPS.map((step, index) => (
								<li
									className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
									key={step.title}
								>
									<span
										className={`mb-3 block font-bold text-4xl text-[#00ACED]/80 ${DISPLAY_FONT}`}
									>
										{index + 1}
									</span>
									<h3 className="mb-2 font-semibold">{step.title}</h3>
									<p className="text-sm text-white/60 leading-relaxed">
										{step.body}
									</p>
								</li>
							))}
						</ol>
						<p className="mt-6 text-sm text-white/50">
							Power users: every element carries stable hb-* class names, so the
							OBS Custom CSS field can restyle anything.
						</p>
					</section>
				</main>

				<footer className="border-white/10 border-t">
					<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center text-sm text-white/50">
						<div className="flex items-center gap-2">
							<PawPrint className="size-4 text-[#00ACED]" />
							<span className={`font-bold text-white ${DISPLAY_FONT}`}>
								HowlBox
							</span>
						</div>
						<div className="flex gap-5">
							<a
								className="hover:text-white"
								href="https://github.com/mrdemonwolf/howlbox"
								rel="noreferrer"
								target="_blank"
							>
								GitHub
							</a>
							<a
								className="hover:text-white"
								href="https://mrdwolf.net/discord"
								rel="noreferrer"
								target="_blank"
							>
								Discord
							</a>
							<a
								className="hover:text-white"
								href="https://github.com/mrdemonwolf/howlbox/blob/main/LICENSE"
								rel="noreferrer"
								target="_blank"
							>
								MIT License
							</a>
						</div>
						<p>
							Made with love by{" "}
							<a
								className="text-white/70 hover:text-white"
								href="https://www.mrdemonwolf.com"
								rel="noreferrer"
								target="_blank"
							>
								MrDemonWolf, Inc.
							</a>
						</p>
					</div>
				</footer>
			</div>

			<Toaster richColors />
			<TanStackRouterDevtools position="bottom-left" />
		</div>
	);
}
