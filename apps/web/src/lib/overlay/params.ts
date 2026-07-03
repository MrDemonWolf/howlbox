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
	"cozy",
	"nobox",
	"retro95",
	"arcade",
	"galaxy",
	"mocha",
] as const;

// Every option rides in the OBS source URL. Invalid or missing values
// fall back to defaults instead of erroring: a typo in OBS must never
// produce a blank overlay.
// bare params count as on: ?hidebots == ?hidebots=true
const boolParam = z
	.preprocess((value) => {
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			return value === 1;
		}
		if (typeof value === "string") {
			return ["", "1", "true", "on", "yes"].includes(value.toLowerCase());
		}
		return false;
	}, z.boolean())
	.catch(false);

const loginList = z
	.preprocess((value) => {
		if (typeof value !== "string") {
			return [];
		}
		return value
			.split(",")
			.map((login) => login.trim().toLowerCase())
			.filter((login) => /^[a-z0-9_]{1,25}$/.test(login));
	}, z.array(z.string()))
	.catch([]);

// TanStack Router's search parser JSON-types values: ?channel=123456
// arrives as a number, ?channel=true as a boolean, ?channel=null as
// null. All are valid Twitch login shapes, so stringify scalars back.
const scalarToString = (value: unknown) =>
	typeof value === "number" || typeof value === "boolean" || value === null
		? String(value)
		: value;

// and ?max=true would coerce to Number(true)=1; force it to fall back
const numberish = (value: unknown) =>
	typeof value === "boolean" ? Number.NaN : value;

export const overlayParamsSchema = z.object({
	channel: z
		.preprocess(
			scalarToString,
			z
				.string()
				.trim()
				.toLowerCase()
				.regex(/^[a-z0-9_]{1,25}$/)
				.optional(),
		)
		.catch(undefined),
	bg: z.enum(BG_MODES).catch("off"),
	theme: z.enum(THEMES).catch("wolf"),
	max: z
		.preprocess(numberish, z.coerce.number().int().min(1).max(200))
		.catch(50),
	hidebots: boolParam,
	hide: loginList,
	// hold non-mod messages N seconds so moderation deletes land
	// before the overlay ever shows the message
	delay: z
		.preprocess(numberish, z.coerce.number().int().min(0).max(300))
		.catch(0),
});

export type OverlayParams = z.infer<typeof overlayParamsSchema>;
