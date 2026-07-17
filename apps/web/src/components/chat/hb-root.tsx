import { cn } from "@howlbox/ui/lib/utils";
import type { ReactNode } from "react";

import type { BgMode, Theme } from "@/lib/overlay/params";

// The hb-root surface every overlay view shares: theme font/color vars
// plus the data-bg/data-theme hooks the CSS themes key off. The live
// overlay is fixed full-screen and the previews are absolute cards, so
// the caller supplies its own positioning through className.
// `hb-root` is a public OBS Custom CSS class: never rename it.
export const HB_ROOT_CLASS =
	"hb-root flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:var(--hb-font-size)]";

export function HbRoot({
	bg,
	theme,
	className,
	children,
}: {
	bg: BgMode;
	theme: Theme;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(HB_ROOT_CLASS, className)}
			data-bg={bg}
			data-theme={theme}
		>
			{children}
		</div>
	);
}
