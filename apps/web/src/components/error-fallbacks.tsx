// Route-level error fallbacks. TanStack Router calls an errorComponent
// when a route throws while rendering or a lazy chunk fails to load; the
// default is a bare error string. Two shapes: one legible card for the
// site, and one transparent status pill for the overlay so an OBS browser
// source never turns into a blank or default-error page mid-stream.

import type { ErrorComponentProps } from "@tanstack/react-router";

export function RootErrorFallback({ error, reset }: ErrorComponentProps) {
	return (
		<div
			className="flex min-h-dvh items-center justify-center p-6"
			role="alert"
		>
			<div className="hb-card flex max-w-md flex-col gap-3 p-6 text-center">
				<h1 className="hb-display font-semibold text-[color:var(--site-txt-1)] text-xl">
					Something broke on this page
				</h1>
				<p className="text-[color:var(--site-txt-2)] text-sm leading-relaxed">
					The overlay builder hit an unexpected error. Reloading usually clears
					it; your OBS overlay URL is unaffected.
				</p>
				{error?.message && (
					<p className="break-words font-mono text-[color:var(--site-txt-2)] text-xs">
						{error.message}
					</p>
				)}
				<div className="flex justify-center gap-2 pt-1">
					<button
						className="hb-btn hb-btn-primary"
						onClick={() => reset()}
						type="button"
					>
						Try again
					</button>
					{/* BASE_URL, not "/": on GitHub Pages the app lives at
					    /howlbox/, so a bare "/" would leave the site */}
					<a
						className="hb-btn hb-btn-secondary"
						href={import.meta.env.BASE_URL}
					>
						Go home
					</a>
				</div>
			</div>
		</div>
	);
}

// Overlay fallback: the same status-pill treatment the connection states
// use, on a transparent background (main.tsx has already stamped the
// hb-overlay class on <html> for this route), so a parse or chunk-load
// failure reads as a small notice instead of a white rectangle.
export function OverlayErrorFallback() {
	return (
		<div
			className="hb-status hb-hint absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 font-sans text-white text-xs"
			role="alert"
		>
			Overlay could not start, check the URL and reload the source
		</div>
	);
}
