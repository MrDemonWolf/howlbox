import { cn } from "@howlbox/ui/lib/utils";

import { HbRoot } from "@/components/chat/hb-root";
import { MessageList } from "@/components/chat/message-list";
import { THEME_VARIANTS, THEMES, type Theme } from "@/lib/overlay/params";
import {
	FAMILY_LABEL,
	FAMILY_ORDER,
	THEME_FAMILY,
	THEME_LABEL,
	VARIANT_LABEL,
	VARIANT_SWATCH,
} from "@/lib/overlay/theme-meta";
import type { ChatMessageView } from "@/lib/twitch/types";

import "@/components/chat/overlay.css";
import "@/components/chat/themes/index.css";

// two short, static messages rendered in each theme's real surface, so
// the gallery shows the actual product instead of a gradient swatch
const SAMPLE: ChatMessageView[] = [
	{
		id: "wall-1",
		timestamp: 0,
		channelId: null,
		login: "wolfpup",
		displayName: "WolfPup",
		color: "#00ACED",
		badges: [],
		renderBadges: [],
		parts: [{ type: "text", text: "gg that was clutch" }],
		isAction: false,
		isPrivileged: true,
		// the wall is where the per-theme avatar shape is visible side by
		// side (circle on wolf, hard square on terminal and retro95)
		avatarUrl:
			"https://static-cdn.jtvnw.net/user-default-pictures-uv/de130ab0-def7-11e9-b668-784f43822e80-profile_image-70x70.png",
	},
	{
		id: "wall-2",
		timestamp: 0,
		channelId: null,
		login: "nova",
		displayName: "Nova",
		color: "#FF6AA2",
		badges: [],
		renderBadges: [],
		parts: [
			{ type: "text", text: "welcome in " },
			{
				type: "emote",
				name: "Kappa",
				url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
			},
		],
		isAction: false,
		isPrivileged: false,
	},
];

function ThemeTile({
	theme,
	selected,
	selectedVariant,
	onSelect,
}: {
	theme: Theme;
	selected: boolean;
	selectedVariant: string;
	onSelect: (theme: Theme, variant: string) => void;
}) {
	const variants: readonly string[] = THEME_VARIANTS[theme];
	return (
		// content-visibility skips rendering below-fold tiles until they
		// scroll near, which keeps a 31-tile wall cheap with no observer code
		<div className="[contain-intrinsic-size:auto_16rem] [content-visibility:auto]">
			<button
				aria-pressed={selected && selectedVariant === ""}
				className={cn(
					"hb-card group flex w-full flex-col overflow-hidden text-left transition-all hover:-translate-y-1 hover:border-[color:var(--site-brand)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
					selected && "border-[color:var(--site-brand)]",
				)}
				onClick={() => onSelect(theme, "")}
				type="button"
			>
				<div className="relative flex min-h-[9rem] items-end overflow-hidden bg-[linear-gradient(135deg,#0b1017_0%,#141a28_100%)]">
					<HbRoot bg="bubble" className="w-full" theme={theme}>
						<MessageList
							animate={false}
							bg="bubble"
							fadeSeconds={0}
							messages={SAMPLE}
							showAvatars={true}
							showBadges={false}
							showPronouns={false}
							showTimestamps={false}
							theme={theme}
						/>
					</HbRoot>
				</div>
				<div className="hb-hairline flex items-center justify-between border-t px-4 py-3">
					<span className="font-semibold text-sm">{THEME_LABEL[theme]}</span>
					<code className="hb-text-2 font-mono text-xs transition-colors group-hover:text-[color:var(--site-brand-text)]">
						?theme={theme}
					</code>
				</div>
			</button>
			{variants.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1.5 px-1">
					{variants.map((variant) => (
						<button
							aria-pressed={selected && selectedVariant === variant}
							className={cn(
								"hb-hairline-strong flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[color:var(--site-txt-2)] text-xs transition-colors hover:border-[color:var(--site-brand)] hover:text-[color:var(--site-txt-1)]",
								selected &&
									selectedVariant === variant &&
									"border-[color:var(--site-brand)] bg-[color:var(--site-brand-tint)] text-[color:var(--site-txt-1)]",
							)}
							key={variant}
							onClick={() => onSelect(theme, variant)}
							type="button"
						>
							<span
								aria-hidden="true"
								className="hb-hairline size-3 shrink-0 rounded-full border"
								style={{
									background: (VARIANT_SWATCH[theme] as Record<string, string>)[
										variant
									],
								}}
							/>
							{(VARIANT_LABEL[theme] as Record<string, string>)[variant]}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function ThemeWall({
	selected,
	selectedVariant,
	onSelect,
}: {
	selected: Theme;
	selectedVariant: string;
	onSelect: (theme: Theme, variant: string) => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			{FAMILY_ORDER.map((family) => (
				<section key={family}>
					<h3 className="hb-kicker mb-4">{FAMILY_LABEL[family]}</h3>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{THEMES.filter((theme) => THEME_FAMILY[theme] === family).map(
							(theme) => (
								<ThemeTile
									key={theme}
									onSelect={onSelect}
									selected={theme === selected}
									selectedVariant={selectedVariant}
									theme={theme}
								/>
							),
						)}
					</div>
				</section>
			))}
		</div>
	);
}
