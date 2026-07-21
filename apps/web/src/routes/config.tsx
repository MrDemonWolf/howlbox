import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ConfigBuilder } from "@/components/landing/config-builder";
import {
	BackLink,
	Eyebrow,
	OBSSteps,
	SiteShell,
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
		<SiteShell>
			<section className="hb-bg-base mx-auto max-w-6xl px-6 pt-12 pb-8">
				<div className="mb-8">
					<BackLink />
				</div>
				<Eyebrow>Builder</Eyebrow>
				<h1 className="hb-display mt-5 text-balance text-4xl lg:text-5xl">
					Build your overlay URL
				</h1>
				<p className="hb-text-2 mt-4 max-w-2xl text-pretty text-lg leading-relaxed">
					The preview on the left is the real overlay, rendered over an OBS
					transparency checker. Already running one? Paste its URL at the top of
					the form and every control loads with your settings.
				</p>
			</section>

			<section className="hb-bg-base mx-auto max-w-6xl px-6 pb-20">
				<ConfigBuilder initialTheme={theme} />
			</section>

			<OBSSteps index="01" tone="surface" />
		</SiteShell>
	);
}
