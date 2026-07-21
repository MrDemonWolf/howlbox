import { cn } from "@howlbox/ui/lib/utils";

import {
	BackLink,
	Eyebrow,
	MONO,
	SiteShell,
} from "@/components/landing/site-chrome";

// Shared shell for the static legal pages (privacy, terms). Same chrome
// as the landing/config routes; the body is a single readable prose
// column. Section styling rides on descendant utilities so each route
// stays a plain list of <section>/<h2>/<p> blocks.
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
		<SiteShell>
			<div className="mx-auto max-w-3xl px-6 pt-12 pb-24">
				<div className="mb-8">
					<BackLink />
				</div>
				<Eyebrow>Legal</Eyebrow>
				<h1 className="hb-display mt-5 text-balance text-4xl lg:text-5xl">
					{title}
				</h1>
				<p className={`hb-text-2 mt-4 text-[0.7rem] ${MONO}`}>
					Last updated: {lastUpdated}
				</p>

				{/* prose column: headings, paragraphs, lists, and links all
				    styled from here so the route files stay declarative */}
				<div
					className={cn(
						"hb-text-2 mt-12 flex flex-col gap-10 text-[0.95rem] leading-relaxed",
						"[&_h2]:hb-display [&_h2]:mb-3 [&_h2]:text-[color:var(--site-txt-1)] [&_h2]:text-xl",
						"[&_p:last-child]:mb-0 [&_p]:mb-3",
						"[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
						"[&_li]:marker:text-[color:var(--site-brand)]",
						"[&_code]:rounded [&_code]:bg-[color:var(--site-surface)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
						"[&_a]:text-[color:var(--site-brand-text)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[color:var(--site-txt-1)]",
					)}
				>
					{children}
				</div>
			</div>
		</SiteShell>
	);
}
