import { cn } from "@howlbox/ui/lib/utils";
import type { CSSProperties, ReactNode } from "react";

import type { BgMode, Theme } from "@/lib/overlay/params";

// The hb-root surface every overlay view shares: theme font/color vars
// plus the data-bg/data-theme hooks the CSS themes key off. The live
// overlay is fixed full-screen and the previews are absolute cards, so
// the caller supplies its own positioning through className.
// `hb-root` is a public OBS Custom CSS class: never rename it.
// Text size is the theme's own --hb-font-size times --hb-font-scale, so
// the ?size param scales every theme proportionally instead of flattening
// the ones that deliberately ship smaller type.
export const HB_ROOT_CLASS =
	"hb-root flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:calc(var(--hb-font-size)*var(--hb-font-scale,1))]";

export function HbRoot({
	bg,
	theme,
	size = 100,
	className,
	children,
}: {
	bg: BgMode;
	theme: Theme;
	// percentage of the theme's base size; 100 = untouched
	size?: number;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(HB_ROOT_CLASS, className)}
			data-bg={bg}
			data-theme={theme}
			style={{ "--hb-font-scale": size / 100 } as CSSProperties}
		>
			{children}
		</div>
	);
}
