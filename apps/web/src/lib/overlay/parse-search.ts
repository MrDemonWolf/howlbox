import { AVATAR_MODES } from "@/lib/twitch/types";

import {
	BG_MODES,
	FALSY_TOKENS,
	LOGIN_RE,
	MEDIA_MODES,
	normalizeEventList,
	normalizeLoginList,
	normalizeVariant,
	OVERLAY_DEFAULTS,
	type OverlayParams,
	THEMES,
	TRUTHY_TOKENS,
} from "./config";

function toQueryValue(raw: string): string | number | boolean {
	if (!raw) return "";
	if (raw === "false") return false;
	if (raw === "true") return true;
	const numeric = Number(raw);
	return numeric * 0 === 0 && String(numeric) === raw ? numeric : raw;
}

// Match the router default decoder without pulling it into the direct OBS
// entry. Duplicate keys become arrays. JSON parsing happens only for a single
// string value, exactly as it does in TanStack Router.
function decodeSearch(search: URLSearchParams): Record<string, unknown> {
	const decoded: Record<string, unknown> = Object.create(null);
	for (const [key, raw] of search) {
		const value = toQueryValue(raw);
		const previous = decoded[key];
		if (previous == null) {
			decoded[key] = value;
		} else if (Array.isArray(previous)) {
			previous.push(value);
		} else {
			decoded[key] = [previous, value];
		}
	}
	for (const key in decoded) {
		const value = decoded[key];
		if (typeof value !== "string") continue;
		try {
			decoded[key] = JSON.parse(value) as unknown;
		} catch {
			// Plain query-string value, keep it as text.
		}
	}
	return decoded;
}

function oneOf<const T extends readonly string[]>(
	values: T,
	raw: unknown,
	fallback: T[number],
): T[number] {
	return typeof raw === "string" && values.includes(raw as T[number])
		? (raw as T[number])
		: fallback;
}

function integer(
	raw: unknown,
	min: number,
	max: number,
	fallback: number,
): number {
	if (typeof raw === "boolean") return fallback;
	const value = Number(raw);
	return Number.isInteger(value) && value >= min && value <= max
		? value
		: fallback;
}

// emotescale is the one non-integer param: in range it snaps to the
// nearest half step, out of range it falls back like every other scalar.
function halfStep(
	raw: unknown,
	min: number,
	max: number,
	fallback: number,
): number {
	if (typeof raw === "boolean") return fallback;
	const value = Number(raw);
	return Number.isFinite(value) && value >= min && value <= max
		? Math.round(value * 2) / 2
		: fallback;
}

function boolOffByDefault(raw: unknown): boolean {
	if (typeof raw === "boolean") return raw;
	if (typeof raw === "number") return raw === 1;
	if (typeof raw === "string") {
		return raw === "" || TRUTHY_TOKENS.includes(raw.toLowerCase());
	}
	return false;
}

function boolOnByDefault(raw: unknown): boolean {
	if (raw === undefined) return true;
	if (typeof raw === "boolean") return raw;
	if (typeof raw === "number") return raw !== 0;
	if (typeof raw === "string") {
		return !FALSY_TOKENS.includes(raw.toLowerCase());
	}
	return true;
}

function loginList(raw: unknown): string[] {
	if (typeof raw === "string") return normalizeLoginList(raw);
	if (Array.isArray(raw)) return normalizeLoginList(raw.join(","));
	return [];
}

function eventList(raw: unknown): OverlayParams["events"] {
	if (typeof raw === "string") return normalizeEventList(raw);
	if (Array.isArray(raw)) return normalizeEventList(raw.join(","));
	return [];
}

function stringValue(raw: unknown, fallback: string): string {
	if (typeof raw === "number" || typeof raw === "boolean" || raw === null) {
		return String(raw);
	}
	return typeof raw === "string" ? raw : fallback;
}

// The direct OBS entry avoids the site router and Zod bundle. This parser is
// intentionally small, and parity tests compare it with overlayParamsSchema.
export function parseOverlaySearch(search: URLSearchParams): OverlayParams {
	const decoded = decodeSearch(search);
	const rawChannel = stringValue(decoded.channel, "").trim().toLowerCase();
	const channel =
		rawChannel && LOGIN_RE.test(rawChannel) ? rawChannel : undefined;
	const rawRefresh = integer(
		decoded.refresh,
		0,
		1440,
		OVERLAY_DEFAULTS.refresh,
	);
	const refresh = rawRefresh > 0 && rawRefresh < 5 ? 5 : rawRefresh;
	// variant validates against the resolved theme's own list, so the
	// theme has to be settled first
	const theme = oneOf(THEMES, decoded.theme, OVERLAY_DEFAULTS.theme);

	return {
		channel,
		bg: oneOf(BG_MODES, decoded.bg, OVERLAY_DEFAULTS.bg),
		theme,
		variant: normalizeVariant(theme, decoded.variant),
		size: integer(decoded.size, 50, 300, OVERLAY_DEFAULTS.size),
		emotescale: halfStep(decoded.emotescale, 1, 4, OVERLAY_DEFAULTS.emotescale),
		max: integer(decoded.max, 1, 200, OVERLAY_DEFAULTS.max),
		hidebots: boolOffByDefault(decoded.hidebots),
		hide: loginList(decoded.hide),
		delay: integer(decoded.delay, 0, 300, OVERLAY_DEFAULTS.delay),
		hidecommands: boolOffByDefault(decoded.hidecommands),
		allow: loginList(decoded.allow),
		badges: boolOnByDefault(decoded.badges),
		timestamps: boolOffByDefault(decoded.timestamps),
		animate: boolOnByDefault(decoded.animate),
		media: oneOf(MEDIA_MODES, decoded.media, OVERLAY_DEFAULTS.media),
		pronouns: boolOffByDefault(decoded.pronouns),
		events: eventList(decoded.events),
		avatars: oneOf(AVATAR_MODES, decoded.avatars, OVERLAY_DEFAULTS.avatars),
		fade: integer(decoded.fade, 0, 600, OVERLAY_DEFAULTS.fade),
		badgeart: stringValue(decoded.badgeart, OVERLAY_DEFAULTS.badgeart),
		badgegist: stringValue(decoded.badgegist, OVERLAY_DEFAULTS.badgegist),
		refresh,
	};
}
