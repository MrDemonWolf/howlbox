import { cn } from "@howlbox/ui/lib/utils";
import { useState } from "react";

import { OverlayPreview } from "@/components/landing/overlay-preview";
import { THEMES, type Theme } from "@/lib/overlay/params";
import { THEME_LABEL } from "@/lib/overlay/theme-meta";

export function DemoChat() {
	const [theme, setTheme] = useState<Theme>("wolf");

	return (
		<div className="flex flex-col gap-3">
			<OverlayPreview
				animate
				bg="bubble"
				fadeSeconds={0}
				showBadges={false}
				showTimestamps={false}
				theme={theme}
			/>
			<div className="flex flex-wrap justify-center gap-2">
				{THEMES.map((t) => (
					<button
						className={cn(
							"rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
							t === theme
								? "border-[color:var(--site-brand)] bg-[color:var(--site-brand-tint)] text-[color:var(--site-brand-text)]"
								: "hb-hairline-strong hb-text-2 hover:border-[color:var(--site-brand)] hover:text-[color:var(--site-txt-1)]",
						)}
						key={t}
						onClick={() => setTheme(t)}
						type="button"
					>
						{THEME_LABEL[t]}
					</button>
				))}
			</div>
		</div>
	);
}
