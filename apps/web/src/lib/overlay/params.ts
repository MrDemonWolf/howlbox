import { z } from "zod";

export const BG_MODES = ["off", "panel", "bubble"] as const;
export const THEMES = [
	"wolf",
	"glass",
	"terminal",
	"neon",
	"dark",
	"light",
	"contrast",
] as const;

// Every option rides in the OBS source URL. Invalid or missing values
// fall back to defaults instead of erroring: a typo in OBS must never
// produce a blank overlay.
export const overlayParamsSchema = z.object({
	channel: z
		.string()
		.trim()
		.toLowerCase()
		.regex(/^[a-z0-9_]{1,25}$/)
		.optional()
		.catch(undefined),
	bg: z.enum(BG_MODES).catch("off"),
	theme: z.enum(THEMES).catch("wolf"),
	max: z.coerce.number().int().min(1).max(200).catch(50),
});

export type OverlayParams = z.infer<typeof overlayParamsSchema>;
