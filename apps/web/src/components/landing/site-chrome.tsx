import { Link } from "@tanstack/react-router";
import { ArrowUpRight, PawPrint } from "lucide-react";

import "@fontsource-variable/bricolage-grotesque/index.css";

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

export const DISPLAY_FONT =
	"[font-family:'Bricolage_Grotesque_Variable',system-ui,sans-serif]";

// the "machine voice": every technical/machine element (kickers, param
// names, URLs, indices, status) speaks in uppercase mono. It is the
// through-line of a product whose whole config is one URL.
export const MONO =
	"font-mono uppercase tracking-[0.22em] [font-family:ui-monospace,'SF_Mono',SFMono-Regular,Menlo,Consolas,monospace]";

// section kicker: a cerulean tick + mono label
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
				<nav
					className={`flex flex-wrap items-center justify-end gap-6 text-white/60 text-xs max-sm:gap-3 ${MONO}`}
				>
					<Link className="hover:text-white" hash="themes" to="/">
						Themes
					</Link>
					<Link className="hover:text-white" hash="setup" to="/">
						Setup
					</Link>
					<a
						className="hover:text-white"
						href={GITHUB_URL}
						rel="noreferrer"
						target="_blank"
					>
						GitHub
					</a>
					<Link
						className="rounded-full border border-[#00ACED]/40 bg-[#00ACED]/10 px-3.5 py-1.5 text-[#7fd7ff] transition-colors hover:border-[#00ACED] hover:text-white"
						to="/config"
					>
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

export function OBSSteps() {
	return (
		<section className="mx-auto max-w-6xl px-6 py-24" id="setup">
			<Eyebrow>Setup</Eyebrow>
			<h2
				className={`mt-5 mb-14 text-balance font-bold text-4xl tracking-tight lg:text-5xl ${DISPLAY_FONT}`}
			>
				Into OBS in four steps
			</h2>
			<ol className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
				{SETUP_STEPS.map((step, index) => (
					<li
						className="group relative bg-[#050a1a]/60 p-6 transition-colors hover:bg-white/[0.03]"
						key={step.title}
					>
						<span className={`text-[#00ACED] text-xs ${MONO}`}>
							{String(index + 1).padStart(2, "0")}
						</span>
						<h3 className="mt-4 mb-2 font-semibold text-lg">{step.title}</h3>
						<p className="text-sm text-white/55 leading-relaxed">{step.body}</p>
					</li>
				))}
			</ol>
			<p className={`mt-6 text-white/55 text-xs ${MONO}`}>
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

// Build-time git SHA, injected by Vite `define` (GitHub Actions sets GITHUB_SHA).
// Empty string in local dev, so the footer just omits the chip.
declare const __COMMIT_SHA__: string;
const COMMIT_SHA = typeof __COMMIT_SHA__ === "string" ? __COMMIT_SHA__ : "";

export function SiteFooter() {
	return (
		<footer className="border-white/10 border-t">
			<div className="mx-auto w-full max-w-6xl px-6 py-14">
				<div className="flex flex-col gap-10 md:flex-row md:justify-between">
					{/* Brand block */}
					<div className="max-w-sm">
						<div className="flex items-center gap-2">
							<PawPrint className="size-5 text-[#00ACED]" />
							<span className={`font-bold text-lg text-white ${DISPLAY_FONT}`}>
								HowlBox
							</span>
						</div>
						<p className="mt-4 text-pretty text-sm text-white/55 leading-relaxed">
							A self-hosted, client-only Twitch chat overlay for OBS browser
							sources.
						</p>
					</div>

					{/* Link groups */}
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
						<FooterGroup label="Get started">
							<FooterLink to="/config">Configure</FooterLink>
							<FooterLink hash="themes">Themes</FooterLink>
							<FooterLink hash="setup">Setup</FooterLink>
						</FooterGroup>
						<FooterGroup label="Project">
							<FooterLink href={GITHUB_URL}>GitHub</FooterLink>
							<FooterLink href="https://mrdwolf.net/discord">
								Discord
							</FooterLink>
							<FooterLink href="https://www.mrdemonwolf.com">
								Website
							</FooterLink>
						</FooterGroup>
						<FooterGroup label="Legal">
							<FooterLink href={`${GITHUB_URL}/blob/main/LICENSE`}>
								MIT License
							</FooterLink>
							<FooterLink to="/privacy">Privacy</FooterLink>
							<FooterLink to="/terms">Terms</FooterLink>
						</FooterGroup>
					</div>
				</div>

				<p className="mt-10 max-w-2xl text-pretty text-white/55 text-xs leading-relaxed">
					{DISCLAIMER}
				</p>

				<div className="mt-8 flex flex-col gap-3 border-white/10 border-t pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
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
					<div className="flex items-center gap-4 text-white/55">
						{COMMIT_SHA && (
							<a
								className={`text-[0.7rem] underline-offset-4 transition-colors hover:text-white hover:underline ${MONO}`}
								href={`${GITHUB_URL}/commit/${COMMIT_SHA}`}
								rel="noreferrer"
								target="_blank"
								title={`Deployed commit ${COMMIT_SHA}`}
							>
								{COMMIT_SHA.slice(0, 7)}
							</a>
						)}
					</div>
				</div>
			</div>
		</footer>
	);
}

function FooterGroup({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<p className={`text-[#7fd7ff] text-[0.7rem] ${MONO}`}>{label}</p>
			<ul className="mt-4 space-y-2.5">{children}</ul>
		</div>
	);
}

// One link renderer for the three link shapes the footer needs: an external
// site (href), an internal route (to), or a same-page hash target (hash).
function FooterLink({
	href,
	to,
	hash,
	children,
}: {
	href?: string;
	to?: string;
	hash?: string;
	children: React.ReactNode;
}) {
	const className =
		"inline-flex items-center gap-1 rounded-sm text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ACED]/60";

	if (href) {
		return (
			<li>
				<a className={className} href={href} rel="noreferrer" target="_blank">
					{children}
					<ArrowUpRight aria-hidden className="size-3 opacity-60" />
					<span className="sr-only">(opens in a new tab)</span>
				</a>
			</li>
		);
	}

	return (
		<li>
			<Link
				className={`${className} hover:underline hover:underline-offset-4`}
				hash={hash}
				to={hash ? "/" : to}
			>
				{children}
			</Link>
		</li>
	);
}
