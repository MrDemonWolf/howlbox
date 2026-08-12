import { createFileRoute } from "@tanstack/react-router";

import { OverlayErrorFallback } from "@/components/error-fallbacks";
import { overlayParamsSchema } from "@/lib/overlay/params";
import { OverlayApp } from "@/overlay-app";

export const Route = createFileRoute("/overlay")({
	validateSearch: (search) => overlayParamsSchema.parse(search),
	// Every param falls back independently, but the overlay still owns a
	// visible fallback for render and lazy-chunk failures inside the site router.
	errorComponent: OverlayErrorFallback,
	component: OverlayRoute,
});

function OverlayRoute() {
	return <OverlayApp params={Route.useSearch()} />;
}
