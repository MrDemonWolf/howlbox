import { Link } from "@tanstack/react-router";
import { ArrowLeft, PawPrint } from "lucide-react";

import "@fontsource-variable/bricolage-grotesque/index.css";

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

export const DISPLAY_FONT =
	"[font-family:'Bricolage_Grotesque_Variable',system-ui,sans-serif]";

// the "machine voice": every technical/machine element (kickers, param
// names, URLs, indices, status) speaks in uppercase mono. It is the
// through-line of a product whose whole config is one URL.
export const MONO =
	"font-mono uppercase tracking-[0.22em] [font-family:ui-monospace,'SF_Mono',SFMono-Regular,Menlo,Consolas,monospace]";

// section kicker: a cerulean tick + mono label. Used by the legal pages,
// which have no numbered spine of their own.
export function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<span
			className={`inline-flex items-center gap-3 text-[#7fd7ff] text-[0.7rem] ${MONO}`}
		>
			<span className="h-px w-7 bg-[#00ACED]" />
			{children}
		</span>
	);
}

// Numbered kicker chip. Every landing section carries one, so the page
// reads as a single indexed spine: 01 WHY IT'S DIFFERENT, 02 THEMES, and
// so on. Styling lives in index.css (.hb-kicker).
export function Kicker({
	index,
	children,
}: {
	index: string;
	children: React.ReactNode;
}) {
	return (
		<span className="hb-kicker">
			<span className="hb-kicker-num">{index}</span>
			{children}
		</span>
	);
}

// The one section header on the site: kicker, title, optional sub. Every
// section uses it so vertical rhythm and type scale cannot drift.
export function SectionHead({
	index,
	kicker,
	title,
	sub,
	align = "left",
}: {
	index: string;
	kicker: string;
	title: React.ReactNode;
	sub?: React.ReactNode;
	align?: "left" | "center";
}) {
	const centered = align === "center";

	return (
		<div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
			<Kicker index={index}>{kicker}</Kicker>
			<h2
				className={`mt-5 text-balance font-bold text-4xl tracking-[-0.02em] lg:text-5xl ${DISPLAY_FONT}`}
			>
				{title}
			</h2>
			{sub ? (
				<p className="mt-4 text-pretty text-[color:var(--site-txt-2)] text-lg leading-relaxed">
					{sub}
				</p>
			) : null}
		</div>
	);
}

// Shared "back to home" affordance for the config and legal routes.
export function BackLink() {
	return (
		<Link
			className={`inline-flex items-center gap-1.5 text-[0.7rem] text-white/50 transition-colors hover:text-white ${MONO}`}
			to="/"
		>
			<ArrowLeft className="size-3.5" /> Home
		</Link>
	);
}

// deep-space canvas: aurora mesh + film grain + broadcast grid, all
// fixed and pointer-transparent
export function PageBackground() {
	return (
		<div aria-hidden className="pointer-events-none fixed inset-0 z-0">
			<div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_50%_-10%,#0b1c44_0%,#081231_44%,#040713_100%)]" />
			<div className="hb-aurora" />
			<div className="hb-grid" />
			<div className="hb-grain" />
		</div>
	);
}

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-white/5 border-b bg-[#040713]/70 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link
					className={`flex items-center gap-2 font-bold text-lg ${DISPLAY_FONT}`}
					to="/"
				>
					<PawPrint className="size-5 text-[#00ACED]" />
					HowlBox
				</Link>
				{/* the mono machine voice stays on the text links; the CTA is a
				    real button from the shared ladder, so it must not inherit
				    the nav's uppercase tracking */}
				<nav className="flex flex-wrap items-center justify-end gap-5 max-sm:gap-3">
					<Link
						className={`text-white/60 text-xs transition-colors hover:text-white ${MONO}`}
						hash="themes"
						to="/"
					>
						Themes
					</Link>
					<Link
						className={`text-white/60 text-xs transition-colors hover:text-white ${MONO}`}
						hash="setup"
						to="/"
					>
						Setup
					</Link>
					<a
						className={`text-white/60 text-xs transition-colors hover:text-white ${MONO}`}
						href={GITHUB_URL}
						rel="noreferrer"
						target="_blank"
					>
						GitHub
					</a>
					<Link className="hb-btn hb-btn-sm hb-btn-primary" to="/config">
						Configure
					</Link>
				</nav>
			</div>
		</header>
	);
}

const SETUP_STEPS = [
	{
		title: "Build your URL",
		body: "Pick a theme and mode in the configurator, then copy the URL it writes for you.",
	},
	{
		title: "Add a Browser source",
		body: "In OBS: Sources, plus, Browser. Paste the URL into the address field.",
	},
	{
		title: "Size it on the source",
		body: "Set Width and Height in the source properties (try 480 x 800). Don't stretch with the transform handles, that blurs it.",
	},
	{
		title: "Leave both checkboxes off",
		body: '"Shutdown source when not visible" and "Refresh when scene becomes active" both fight a live chat feed.',
	},
];

export function OBSSteps({ index = "04" }: { index?: string }) {
	return (
		<section className="mx-auto max-w-6xl px-6 py-24" id="setup">
			<SectionHead
				align="center"
				index={index}
				kicker="Setup"
				sub="Four steps, no account, nothing to install. The URL is the whole product."
				title="Into OBS in four steps"
			/>
			<ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{SETUP_STEPS.map((step, stepIndex) => (
					<li
						className="hb-card p-6 transition-colors hover:border-[#00ACED]/40"
						key={step.title}
					>
						<span className="hb-kicker-num text-xs">
							{String(stepIndex + 1).padStart(2, "0")}
						</span>
						<h3 className="mt-4 mb-2 font-semibold text-lg">{step.title}</h3>
						<p className="text-[color:var(--site-txt-2)] text-sm leading-relaxed">
							{step.body}
						</p>
					</li>
				))}
			</ol>
			<p className={`mt-6 text-center text-white/45 text-xs ${MONO}`}>
				Power users: every node carries a stable hb-* class for the OBS Custom
				CSS field.
			</p>
		</section>
	);
}

// HowlBox is an independent tool; keep the affiliation disclaimer honest.
// Mirrors the Wolfathon footer pattern.
export const DISCLAIMER =
	"HowlBox is an independent, open-source tool. Not affiliated with, endorsed by, or sponsored by Twitch Interactive, Amazon, 7TV, BetterTTV, or FrankerFaceZ. Twitch is a trademark of Twitch Interactive, Inc.";

export function SiteFooter() {
	// Single compact row (copyright + inline nav), matching the wolfwave
	// footer; the Twitch/7TV disclaimer sits above it since HowlBox
	// surfaces those trademarks and wolfwave has no equivalent need.
	return (
		<footer className="border-white/10 border-t">
			<div className="mx-auto w-full max-w-6xl px-6 py-10">
				<p className="text-pretty text-white/45 text-xs leading-relaxed">
					{DISCLAIMER}
				</p>
				<div className="mt-6 flex flex-col items-center justify-between gap-4 border-white/10 border-t pt-6 text-sm text-white/55 sm:flex-row">
					<p>
						© {new Date().getFullYear()} HowlBox by{" "}
						<a
							className="text-white/70 transition-colors hover:text-white"
							href="https://www.mrdemonwolf.com"
							rel="noreferrer"
							target="_blank"
						>
							MrDemonWolf, Inc.
						</a>
					</p>
					<nav className="flex flex-wrap items-center justify-center gap-6">
						<a
							className="transition-colors hover:text-white"
							href={GITHUB_URL}
							rel="noreferrer"
							target="_blank"
						>
							GitHub
						</a>
						<a
							className="transition-colors hover:text-white"
							href="https://mrdwolf.net/discord"
							rel="noreferrer"
							target="_blank"
						>
							Discord
						</a>
						<Link className="transition-colors hover:text-white" to="/privacy">
							Privacy
						</Link>
						<Link className="transition-colors hover:text-white" to="/terms">
							Terms
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
}
