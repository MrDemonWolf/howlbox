import {
	type BgMode,
	OVERLAY_DEFAULTS,
	overlayParamsSchema,
	type Theme,
} from "@/lib/overlay/params";
import {
	type AvatarMode,
	type ChatEventKind,
	EVENT_KINDS,
} from "@/lib/twitch/types";

export interface OverlayConfig {
	channel: string;
	theme: Theme;
	bg: BgMode;
	size: number;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
	pronouns: boolean;
	hide: string[];
	allow: string[];
	badgeart: string;
	badgegist: string;
	refresh: number;
	events: ChatEventKind[];
	avatars: AvatarMode;
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
	if (config.size !== OVERLAY_DEFAULTS.size) {
		qs.set("size", String(config.size));
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
	if (config.pronouns) {
		qs.set("pronouns", "true");
	}
	if (config.hide.length > 0) {
		qs.set("hide", config.hide.join(","));
	}
	if (config.allow.length > 0) {
		qs.set("allow", config.allow.join(","));
	}
	if (config.badgeart !== OVERLAY_DEFAULTS.badgeart) {
		qs.set("badgeart", config.badgeart);
	}
	if (config.badgegist !== OVERLAY_DEFAULTS.badgegist) {
		qs.set("badgegist", config.badgegist);
	}
	if (config.refresh !== OVERLAY_DEFAULTS.refresh) {
		qs.set("refresh", String(config.refresh));
	}
	if (config.events.length > 0) {
		// everything selected serializes to the shorthand: shorter to
		// hand-edit in OBS, and an "all" link picks up any event kind
		// added later instead of freezing today's list
		qs.set(
			"events",
			config.events.length === EVENT_KINDS.length
				? "all"
				: config.events.join(","),
		);
	}
	if (config.avatars !== OVERLAY_DEFAULTS.avatars) {
		qs.set("avatars", config.avatars);
	}
	return qs.toString();
}

export function buildOverlayUrl(config: OverlayConfig): string {
	return `${window.location.origin}${import.meta.env.BASE_URL}overlay?${overlayQuery(config)}`;
}

// Read an existing overlay link back into a config, so a streamer can
// paste the URL already in OBS and keep editing it. Accepts a full URL,
// a bare query string, or "?a=b". Every field runs back through
// overlayParamsSchema, so a hand-edited or truncated link degrades to
// defaults exactly like the overlay itself would render it. Returns null
// only when there are no params at all (nothing to import).
export function parseOverlayUrl(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) {
		return null;
	}
	// take everything after the first "?" when present, else treat the
	// whole string as the query (paste of "channel=x&theme=neon")
	const queryStart = trimmed.indexOf("?");
	const query = queryStart === -1 ? trimmed : trimmed.slice(queryStart + 1);
	const search = new URLSearchParams(query.split("#")[0]);
	// Require at least one param the overlay actually knows, so pasting
	// unrelated text reports an error instead of silently wiping the form
	// back to defaults.
	const known = new Set(Object.keys(overlayParamsSchema.shape));
	if (![...search.keys()].some((key) => known.has(key))) {
		return null;
	}
	return overlayParamsSchema.parse(Object.fromEntries(search));
}
