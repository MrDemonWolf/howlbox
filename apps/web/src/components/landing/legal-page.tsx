import { Toaster } from "@howlbox/ui/components/sonner";
import { cn } from "@howlbox/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
	DISPLAY_FONT,
	Eyebrow,
	MONO,
	PageBackground,
	SiteFooter,
	SiteHeader,
} from "@/components/landing/site-chrome";

// Shared shell for the static legal pages (privacy, terms). Same
// deep-space chrome as the landing/config routes; the body is a single
// readable prose column. Section styling rides on descendant utilities
// so each route stays a plain list of <section>/<h2>/<p> blocks.
export function LegalPage({
	title,
	lastUpdated,
	children,
}: {
	title: string;
	lastUpdated: string;
	children: React.ReactNode;
}) {
	return (
		<div className="dark min-h-svh scroll-smooth bg-[#040713] text-white antialiased">
			<PageBackground />

			<div className="relative z-10">
				<SiteHeader />

				<main className="mx-auto max-w-3xl px-6 pt-12 pb-24">
					<Link
						className={`mb-8 inline-flex items-center gap-1.5 text-[0.7rem] text-white/50 hover:text-white ${MONO}`}
						to="/"
					>
						<ArrowLeft className="size-3.5" /> Home
					</Link>
					<Eyebrow>Legal</Eyebrow>
					<h1
						className={`mt-5 text-balance font-bold text-4xl tracking-[-0.02em] lg:text-5xl ${DISPLAY_FONT}`}
					>
						{title}
					</h1>
					<p className={`mt-4 text-[0.7rem] text-white/45 ${MONO}`}>
						Last updated: {lastUpdated}
					</p>

					{/* prose column: headings, paragraphs, lists, and links all
					    styled from here so the route files stay declarative */}
					<div
						className={cn(
							"mt-12 flex flex-col gap-10 text-[0.95rem] text-white/70 leading-relaxed",
							"[&_h2]:mb-3 [&_h2]:font-semibold [&_h2]:text-white [&_h2]:text-xl [&_h2]:tracking-tight",
							"[&_h2]:[font-family:'Bricolage_Grotesque_Variable',system-ui,sans-serif]",
							"[&_p:last-child]:mb-0 [&_p]:mb-3",
							"[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
							"[&_li]:marker:text-[#00ACED]",
							"[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
							"[&_a]:text-[#7fd7ff] [&_a]:underline [&_a]:decoration-[#00ACED]/40 [&_a]:underline-offset-2 hover:[&_a]:text-white",
						)}
					>
						{children}
					</div>
				</main>

				<SiteFooter />
			</div>

			<Toaster richColors />
		</div>
	);
}
