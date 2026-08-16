import { cn } from "@howlbox/ui/lib/utils";
import { useState } from "react";

import { OverlayPreview } from "@/components/landing/overlay-preview";
import {
	BG_MODES,
	THEME_VARIANTS,
	THEMES,
	type Theme,
} from "@/lib/overlay/params";
import {
	BG_LABEL,
	FAMILY_LABEL,
	FAMILY_ORDER,
	THEME_FAMILY,
	THEME_LABEL,
	THEME_SWATCH,
	type ThemeFamily,
	VARIANT_LABEL,
	VARIANT_SWATCH,
} from "@/lib/overlay/theme-meta";

// Every theme in one place without a wall of live overlays: the picker
// is cheap swatches and only the selected theme renders as a real
// preview, so the page pays for exactly one MessageList no matter how
// many themes exist. The overlay itself loads one theme's CSS the same
// way, so this also mirrors what a browser source actually fetches.
export function ThemeExplorer() {
	const [theme, setTheme] = useState<Theme>("wolf");
	const [variant, setVariant] = useState("");
	const [family, setFamily] = useState<ThemeFamily>("clean");
	const [bg, setBg] = useState<(typeof BG_MODES)[number]>("bubble");

	const variants: readonly string[] = THEME_VARIANTS[theme];
	const query = [
		`theme=${theme}`,
		variant ? `variant=${variant}` : "",
		bg === "off" ? "" : `bg=${bg}`,
	]
		.filter(Boolean)
		.join("&");

	return (
		<div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
			<div className="flex flex-col gap-3">
				<OverlayPreview
					animate
					bg={bg}
					className="h-80"
					fadeSeconds={0}
					showBadges
					showTimestamps={false}
					theme={theme}
					variant={variant}
				/>
				<code className="hb-code block w-fit max-w-full overflow-x-auto text-xs">
					?channel=you&amp;{query}
				</code>
			</div>

			<div className="flex flex-col gap-4">
				<fieldset className="flex flex-wrap gap-2">
					<legend className="sr-only">Display mode</legend>
					{BG_MODES.map((mode) => (
						<button
							aria-pressed={bg === mode}
							className={cn(
								"hb-btn hb-btn-sm hb-btn-secondary",
								bg === mode && "hb-btn-selected",
							)}
							key={mode}
							onClick={() => setBg(mode)}
							type="button"
						>
							{BG_LABEL[mode]}
						</button>
					))}
				</fieldset>

				<fieldset className="flex flex-wrap gap-2">
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

				<fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					<legend className="sr-only">Theme</legend>
					{THEMES.filter((t) => THEME_FAMILY[t] === family).map((t) => (
						<button
							aria-pressed={t === theme}
							className={cn(
								"flex min-h-10 items-center gap-2 rounded-[0.7rem] border px-3 text-left text-sm transition-colors",
								t === theme
									? "border-[color:var(--site-brand)] bg-[color:var(--site-brand-tint)] text-[color:var(--site-txt-1)]"
									: "hb-hairline-strong text-[color:var(--site-txt-2)] hover:border-[color:var(--site-brand)] hover:text-[color:var(--site-txt-1)]",
							)}
							key={t}
							onClick={() => {
								setTheme(t);
								setVariant("");
							}}
							type="button"
						>
							<span
								aria-hidden="true"
								className="hb-hairline size-4 shrink-0 rounded-full border"
								style={{ background: THEME_SWATCH[t] }}
							/>
							<span className="truncate">{THEME_LABEL[t]}</span>
						</button>
					))}
				</fieldset>

				{variants.length > 0 && (
					<fieldset className="flex flex-wrap gap-2">
						<legend className="hb-text-2 mb-1.5 w-full text-xs">
							{THEME_LABEL[theme]} variants
						</legend>
						<button
							aria-pressed={variant === ""}
							className={cn(
								"hb-btn hb-btn-sm hb-btn-secondary",
								variant === "" && "hb-btn-selected",
							)}
							onClick={() => setVariant("")}
							type="button"
						>
							Default
						</button>
						{variants.map((v) => (
							<button
								aria-pressed={variant === v}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary flex items-center gap-1.5",
									variant === v && "hb-btn-selected",
								)}
								key={v}
								onClick={() => setVariant(v)}
								type="button"
							>
								<span
									aria-hidden="true"
									className="hb-hairline size-3 shrink-0 rounded-full border"
									style={{
										background: (
											VARIANT_SWATCH[theme] as Record<string, string>
										)[v],
									}}
								/>
								{(VARIANT_LABEL[theme] as Record<string, string>)[v]}
							</button>
						))}
					</fieldset>
				)}
			</div>
		</div>
	);
}
