import { Toaster } from "@howlbox/ui/components/sonner";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { PawMark } from "@/components/landing/paw-mark";

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

// the "machine voice": kickers, param names and URLs speak in uppercase
// mono. It is the through-line of a product whose whole config is one
// URL, so it stays on labels only. Running text and nav links read
// poorly in wide-tracked caps and use the normal face.
export const MONO =
	"font-mono uppercase tracking-[0.22em] [font-family:ui-monospace,'SF_Mono',SFMono-Regular,Menlo,Consolas,monospace]";

// section kicker: a brand tick + mono label. Used by the legal pages,
// which have no numbered spine of their own.
export function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<span
			className={`hb-text-brand inline-flex items-center gap-3 text-[0.7rem] ${MONO}`}
		>
			<span className="h-px w-7 bg-[color:var(--site-brand)]" />
			{children}
		</span>
	);
}

// Numbered kicker chip. Every landing section carries one, so the page
// reads as a single indexed spine: 01 WHO IT'S FOR, 02 THEMES, and so
// on. Styling lives in index.css (.hb-kicker).
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
			<h2 className="hb-display hb-text-1 mt-5 text-balance text-4xl lg:text-5xl">
				{title}
			</h2>
			{sub ? (
				<p className="hb-text-2 mt-4 text-pretty text-lg leading-relaxed">
					{sub}
				</p>
			) : null}
		</div>
	);
}

// Standard full-bleed section band. `tone` picks which of the two
// surfaces it sits on; the page alternates them so sections separate
// without any ambient background effect.
export function Band({
	children,
	id,
	tone = "base",
	className = "",
}: {
	children: React.ReactNode;
	id?: string;
	tone?: "base" | "surface";
	className?: string;
}) {
	return (
		<section
			className={`${tone === "base" ? "hb-bg-base" : "hb-bg-surface"} hb-hairline border-t ${className}`}
			id={id}
		>
			<div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">{children}</div>
		</section>
	);
}

// Shared "back to home" affordance for the config and legal routes.
export function BackLink() {
	return (
		<Link
			className={`hb-text-2 inline-flex items-center gap-1.5 text-[0.7rem] transition-colors hover:text-[color:var(--site-txt-1)] ${MONO}`}
			to="/"
		>
			<ArrowLeft className="size-3.5" /> Home
		</Link>
	);
}

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	// useTheme is unresolved on the server-less first render too, so the
	// icon would swap after mount; render the frame only once it is known
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const dark = resolvedTheme === "dark";

	return (
		<button
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
			className="hb-btn hb-btn-icon hb-btn-ghost"
			onClick={() => setTheme(dark ? "light" : "dark")}
			type="button"
		>
			{mounted && dark ? (
				<Sun className="size-4" />
			) : (
				<Moon className="size-4" />
			)}
		</button>
	);
}

export function SiteHeader() {
	return (
		<header className="hb-hairline sticky top-0 z-30 border-b bg-[color:var(--site-base)]/85 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link
					className="hb-display hb-text-1 flex items-center gap-2 text-lg"
					to="/"
				>
					<PawMark className="size-6 text-[color:var(--site-brand-text)]" />
					HowlBox
				</Link>
				<nav className="flex flex-wrap items-center justify-end gap-4 max-sm:gap-2">
					<Link
						className="hb-text-2 text-sm transition-colors hover:text-[color:var(--site-txt-1)] max-sm:hidden"
						hash="themes"
						to="/"
					>
						Themes
					</Link>
					<Link
						className="hb-text-2 text-sm transition-colors hover:text-[color:var(--site-txt-1)] max-sm:hidden"
						to="/docs"
					>
						Docs
					</Link>
					<a
						className="hb-text-2 text-sm transition-colors hover:text-[color:var(--site-txt-1)] max-sm:hidden"
						href={GITHUB_URL}
						rel="noreferrer"
						target="_blank"
					>
						GitHub
					</a>
					<ThemeToggle />
					<Link className="hb-btn hb-btn-sm hb-btn-primary" to="/config">
						Configure
					</Link>
				</nav>
			</div>
		</header>
	);
}

// Every page on the site is header + content + footer on the token
// canvas. One shell so the three routes cannot drift apart.
export function SiteShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="hb-bg-base hb-text-1 min-h-svh scroll-smooth antialiased">
			{/* WCAG 2.4.1: five header controls sit before the content on
			    every page, so keyboard users need a way past them */}
			<a
				className="hb-btn hb-btn-sm hb-btn-primary sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
				href="#main"
			>
				Skip to content
			</a>
			<SiteHeader />
			<main id="main">{children}</main>
			<SiteFooter />
			<Toaster richColors />
		</div>
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

export function OBSSteps({
	index = "06",
	tone = "base",
}: {
	index?: string;
	tone?: "base" | "surface";
}) {
	return (
		<Band id="setup" tone={tone}>
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
						className="hb-card p-6 transition-colors hover:border-[color:var(--site-brand)]"
						key={step.title}
					>
						<span className="hb-kicker-num text-xs">
							{String(stepIndex + 1).padStart(2, "0")}
						</span>
						<h3 className="mt-4 mb-2 font-semibold text-lg">{step.title}</h3>
						<p className="hb-text-2 text-sm leading-relaxed">{step.body}</p>
					</li>
				))}
			</ol>
			<p className="hb-text-2 mt-6 text-center text-sm">
				Power users: every node carries a stable{" "}
				<code className="font-mono">hb-*</code> class for the OBS Custom CSS
				field.
			</p>
		</Band>
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
		<footer className="hb-bg-surface hb-hairline border-t">
			<div className="mx-auto w-full max-w-6xl px-6 py-10">
				<p className="hb-text-2 text-pretty text-xs leading-relaxed">
					{DISCLAIMER}
				</p>
				<div className="hb-hairline hb-text-2 mt-6 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm sm:flex-row">
					<p>
						© {new Date().getFullYear()} HowlBox by{" "}
						<a
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							href="https://www.mrdemonwolf.com"
							rel="noreferrer"
							target="_blank"
						>
							MrDemonWolf, Inc.
						</a>
					</p>
					<nav className="flex flex-wrap items-center justify-center gap-6">
						<Link
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							to="/docs"
						>
							Docs
						</Link>
						<a
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							href={GITHUB_URL}
							rel="noreferrer"
							target="_blank"
						>
							GitHub
						</a>
						<a
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							href="https://mrdwolf.net/discord"
							rel="noreferrer"
							target="_blank"
						>
							Discord
						</a>
						<Link
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							to="/privacy"
						>
							Privacy
						</Link>
						<Link
							className="transition-colors hover:text-[color:var(--site-txt-1)]"
							to="/terms"
						>
							Terms
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
}
