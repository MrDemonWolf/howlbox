import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
	if (typeof window === "undefined" || !window.matchMedia) {
		return () => {};
	}
	const media = window.matchMedia(QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
	return (
		typeof window !== "undefined" && Boolean(window.matchMedia?.(QUERY).matches)
	);
}

function getServerSnapshot(): boolean {
	return false;
}

// The selected asset URL is decided before a message enters state, so expose
// the media preference as React state rather than relying only on CSS.
export function useReducedMotion(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
