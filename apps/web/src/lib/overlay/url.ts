import {
	type BgMode,
	OVERLAY_DEFAULTS,
	type Theme,
} from "@/lib/overlay/params";

export interface OverlayConfig {
	channel: string;
	theme: Theme;
	bg: BgMode;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
	hide: string[];
	allow: string[];
}

// Serialize a config into the overlay query string, dropping any value
// left at its default so the URL stays short. Inverse of the params
// schema, so the result round-trips back through overlayParamsSchema.
// Pure (no window), so it is unit-checkable on its own.
export function overlayQuery(config: OverlayConfig): string {
	const qs = new URLSearchParams();
	qs.set("channel", config.channel || "your_channel");
	if (config.theme !== OVERLAY_DEFAULTS.theme) {
		qs.set("theme", config.theme);
	}
	if (config.bg !== OVERLAY_DEFAULTS.bg) {
		qs.set("bg", config.bg);
	}
	if (config.max !== OVERLAY_DEFAULTS.max) {
		qs.set("max", String(config.max));
	}
	if (config.delay !== OVERLAY_DEFAULTS.delay) {
		qs.set("delay", String(config.delay));
	}
	if (config.fade !== OVERLAY_DEFAULTS.fade) {
		qs.set("fade", String(config.fade));
	}
	if (config.hidebots) {
		qs.set("hidebots", "true");
	}
	if (config.hidecommands) {
		qs.set("hidecommands", "true");
	}
	if (config.timestamps) {
		qs.set("timestamps", "true");
	}
	if (!config.badges) {
		qs.set("badges", "false");
	}
	if (!config.animate) {
		qs.set("animate", "false");
	}
	if (config.hide.length > 0) {
		qs.set("hide", config.hide.join(","));
	}
	if (config.allow.length > 0) {
		qs.set("allow", config.allow.join(","));
	}
	return qs.toString();
}

export function buildOverlayUrl(config: OverlayConfig): string {
	return `${window.location.origin}${import.meta.env.BASE_URL}overlay?${overlayQuery(config)}`;
}
