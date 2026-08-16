import { type CSSProperties, type ReactNode, useEffect } from "react";

import type { Align, BgMode, Layout, Theme } from "@/lib/overlay/params";

// The hb-root surface every overlay view shares: theme font/color vars
// plus the data-bg/data-theme hooks the CSS themes key off. The live
// overlay is fixed full-screen and the previews are absolute cards, so
// the caller supplies its own positioning through className.
// `hb-root` is a public OBS Custom CSS class: never rename it.
// Text size is the theme's own --hb-font-size times --hb-font-scale, so
// the ?size param scales every theme proportionally instead of flattening
// the ones that deliberately ship smaller type.
export const HB_ROOT_CLASS =
	"hb-root flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:max(0.75rem,calc(var(--hb-font-size)*var(--hb-font-scale,1)))]";

export function HbRoot({
	bg,
	theme,
	variant = "",
	layout = "inline",
	align = "left",
	size = 100,
	emoteScale = 1,
	className,
	children,
}: {
	bg: BgMode;
	theme: Theme;
	// ?variant color variation; "" is the theme default and stamps no
	// data-variant attribute at all, so variant CSS blocks match only a
	// deliberate selection
	variant?: string;
	// ?layout and ?align stamp data attributes only when non-default,
	// same rule as variant; the structural rules live in overlay.css
	layout?: Layout;
	align?: Align;
	// percentage of the theme's base size; 100 = untouched
	size?: number;
	// ?emotescale, applied by the row only to emote-only messages
	emoteScale?: number;
	className?: string;
	children: ReactNode;
}) {
	useEffect(() => {
		if (theme === "arcade" || theme === "gameboy") {
			// Only the pixel themes pay for the custom font; every other OBS
			// theme stays on the system stack and skips the font CSS and
			// network request.
			void import("@fontsource/press-start-2p/latin-400.css").catch(
				() => undefined,
			);
		}
	}, [theme]);
	const rootClassName = className
		? `${HB_ROOT_CLASS} ${className}`
		: HB_ROOT_CLASS;
	return (
		<div
			className={rootClassName}
			data-align={align === "left" ? undefined : align}
			data-bg={bg}
			data-layout={layout === "inline" ? undefined : layout}
			data-theme={theme}
			data-variant={variant || undefined}
			style={
				{
					"--hb-font-scale": size / 100,
					"--hb-emote-boost": emoteScale,
					// Emotes centre on the text line at chat size, which is right
					// until the art is several times the line height: middle then
					// leaves the name floating against the centre of a tall block
					// with no shared edge. Past 1x, jumbo rows drop to the bottom
					// so the name and the emote sit on one floor. Only the value
					// changes here; which rows obey it is CSS (see overlay.css).
					"--hb-emote-align": emoteScale > 1 ? "bottom" : "middle",
				} as CSSProperties
			}
		>
			{children}
		</div>
	);
}
