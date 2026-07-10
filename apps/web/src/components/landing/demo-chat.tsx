import { cn } from "@howlbox/ui/lib/utils";
import { useState } from "react";

import { OverlayPreview } from "@/components/landing/overlay-preview";
import { THEMES } from "@/lib/overlay/params";
import { THEME_LABEL } from "@/lib/overlay/theme-meta";

type Theme = (typeof THEMES)[number];

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
			<div className="flex flex-wrap justify-center gap-1.5">
				{THEMES.map((t) => (
					<button
						className={cn(
							"rounded-full border px-3 py-1 font-medium text-xs transition-colors",
							t === theme
								? "border-[#00ACED] bg-[#00ACED]/15 text-[#7fd7ff]"
								: "border-white/10 text-white/60 hover:border-white/25 hover:text-white",
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
