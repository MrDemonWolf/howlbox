import { Toaster } from "@howlbox/ui/components/sonner";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ConfigBuilder } from "@/components/landing/config-builder";
import {
	BackLink,
	DISPLAY_FONT,
	Kicker,
	OBSSteps,
	PageBackground,
	SiteFooter,
	SiteHeader,
} from "@/components/landing/site-chrome";
import { THEMES } from "@/lib/overlay/params";

// ?theme=neon from a theme-wall tile preselects that theme; anything
// else falls back to no preselection, same spirit as the overlay params
const configSearchSchema = z.object({
	theme: z.enum(THEMES).optional().catch(undefined),
});

export const Route = createFileRoute("/config")({
	validateSearch: (search) => configSearchSchema.parse(search),
	component: ConfigPage,
	head: () => ({
		meta: [
			{ title: "Configurator - HowlBox" },
			{
				name: "description",
				content: "Build your HowlBox overlay URL with a live preview.",
			},
		],
	}),
});

function ConfigPage() {
	const { theme } = Route.useSearch();

	return (
		<div className="dark min-h-svh scroll-smooth bg-[#040713] text-white antialiased">
			<PageBackground />

			<div className="relative z-10">
				<SiteHeader />

				<main>
					<section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
						<div className="mb-8">
							<BackLink />
						</div>
						<Kicker index="01">Configurator</Kicker>
						<h1
							className={`mt-5 text-balance font-bold text-5xl tracking-[-0.02em] lg:text-6xl ${DISPLAY_FONT}`}
						>
							Configure your overlay
						</h1>
						<p className="mt-4 max-w-2xl text-pretty text-[color:var(--site-txt-2)] text-lg leading-relaxed">
							Change anything and watch the preview update live. Already running
							an overlay? Paste its URL at the top of the form and pick up right
							where you left off.
						</p>
					</section>

					<section className="mx-auto max-w-6xl px-6 pb-20">
						<ConfigBuilder initialTheme={theme} />
					</section>

					<OBSSteps index="02" />
				</main>

				<SiteFooter />
			</div>

			<Toaster richColors />
		</div>
	);
}
