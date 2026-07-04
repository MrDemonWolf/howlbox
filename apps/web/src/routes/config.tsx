import { Toaster } from "@howlbox/ui/components/sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ConfigBuilder } from "@/components/landing/config-builder";
import {
	DISPLAY_FONT,
	Eyebrow,
	MONO,
	OBSSteps,
	PageBackground,
	SiteFooter,
	SiteHeader,
} from "@/components/landing/site-chrome";

export const Route = createFileRoute("/config")({
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
	return (
		<div className="dark min-h-svh scroll-smooth bg-[#040713] text-white antialiased">
			<PageBackground />

			<div className="relative z-10">
				<SiteHeader />

				<main>
					<section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
						<Link
							className={`mb-8 inline-flex items-center gap-1.5 text-[0.7rem] text-white/50 hover:text-white ${MONO}`}
							to="/"
						>
							<ArrowLeft className="size-3.5" /> Home
						</Link>
						<Eyebrow>Configurator</Eyebrow>
						<h1
							className={`mt-5 text-balance font-bold text-5xl tracking-[-0.02em] lg:text-6xl ${DISPLAY_FONT}`}
						>
							Configure your overlay
						</h1>
						<p className="mt-4 max-w-2xl text-pretty text-lg text-white/65 leading-relaxed">
							Change anything and watch the preview update live. When it looks
							right, copy the URL into an OBS browser source. No accounts,
							nothing saved, the link is your whole setup.
						</p>
					</section>

					<section className="mx-auto max-w-6xl px-6 pb-20">
						<ConfigBuilder />
					</section>

					<OBSSteps />
				</main>

				<SiteFooter />
			</div>

			<Toaster richColors />
		</div>
	);
}
