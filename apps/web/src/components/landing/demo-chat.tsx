import { cn } from "@howlbox/ui/lib/utils";
import { useState } from "react";

import { OverlayPreview } from "@/components/landing/overlay-preview";
import { THEMES, type Theme } from "@/lib/overlay/params";
import {
	FAMILY_LABEL,
	FAMILY_ORDER,
	THEME_FAMILY,
	THEME_LABEL,
	type ThemeFamily,
} from "@/lib/overlay/theme-meta";

export function DemoChat() {
	const [theme, setTheme] = useState<Theme>("wolf");
	const [family, setFamily] = useState<ThemeFamily>("clean");
	const familyThemes = THEMES.filter((t) => THEME_FAMILY[t] === family);

	// picking a family keeps the current theme rendered until a pill is
	// clicked, so browsing tabs never yanks the preview out from under you
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
			<fieldset className="flex flex-wrap justify-center gap-2">
				<legend className="sr-only">Theme family</legend>
				{FAMILY_ORDER.map((f) => (
					<button
						aria-pressed={f === family}
						className={cn(
							"rounded-full border px-3 py-1.5 font-semibold text-xs uppercase tracking-wide transition-colors",
							f === family
								? "border-[color:var(--site-brand)] bg-[color:var(--site-brand-tint)] text-[color:var(--site-brand-text)]"
								: "hb-hairline-strong hb-text-2 hover:border-[color:var(--site-brand)] hover:text-[color:var(--site-txt-1)]",
						)}
						key={f}
						onClick={() => setFamily(f)}
						type="button"
					>
						{FAMILY_LABEL[f]}
					</button>
				))}
			</fieldset>
			<fieldset className="flex flex-wrap justify-center gap-2">
				<legend className="sr-only">Preview theme</legend>
				{familyThemes.map((t) => (
					<button
						aria-pressed={t === theme}
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
			</fieldset>
		</div>
	);
}
