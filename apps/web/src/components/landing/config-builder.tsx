import { Checkbox } from "@howlbox/ui/components/checkbox";
import { Input } from "@howlbox/ui/components/input";
import { Label } from "@howlbox/ui/components/label";
import { cn } from "@howlbox/ui/lib/utils";
import {
	ChevronDown,
	ClipboardPaste,
	Copy,
	ExternalLink,
	RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OverlayPreview } from "@/components/landing/overlay-preview";
import { MONO } from "@/components/landing/site-chrome";
import {
	BG_MODES,
	type BgMode,
	normalizeLoginList,
	OVERLAY_DEFAULTS,
	THEMES,
	type Theme,
} from "@/lib/overlay/params";
import { BG_LABEL, THEME_LABEL, THEME_SWATCH } from "@/lib/overlay/theme-meta";
import { buildOverlayUrl, parseOverlayUrl } from "@/lib/overlay/url";

interface Config {
	channel: string;
	theme: Theme;
	bg: BgMode;
	size: number;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
	pronouns: boolean;
	hide: string;
	allow: string;
	badgeart: string;
	badgegist: string;
	refresh: number;
}

// Form state. The scalar/toggle defaults come from the shared
// OVERLAY_DEFAULTS so they can't drift from the overlay; hide/allow are
// raw comma strings here, normalized only when the URL is built.
const DEFAULTS: Config = {
	channel: "",
	theme: OVERLAY_DEFAULTS.theme,
	bg: OVERLAY_DEFAULTS.bg,
	size: OVERLAY_DEFAULTS.size,
	max: OVERLAY_DEFAULTS.max,
	delay: OVERLAY_DEFAULTS.delay,
	fade: OVERLAY_DEFAULTS.fade,
	hidebots: OVERLAY_DEFAULTS.hidebots,
	hidecommands: OVERLAY_DEFAULTS.hidecommands,
	timestamps: OVERLAY_DEFAULTS.timestamps,
	badges: OVERLAY_DEFAULTS.badges,
	animate: OVERLAY_DEFAULTS.animate,
	pronouns: OVERLAY_DEFAULTS.pronouns,
	hide: "",
	allow: "",
	badgeart: OVERLAY_DEFAULTS.badgeart,
	badgegist: OVERLAY_DEFAULTS.badgegist,
	refresh: OVERLAY_DEFAULTS.refresh,
};

// The ui package ships dense 32px square fields; the site scale is a
// 44px rounded control. One constant so every field matches the buttons
// (tailwind-merge lets these win over the primitive's own classes).
const FIELD = "h-11 rounded-[0.7rem] px-3 text-sm";

// Named text-size stops. The slider still allows anything in range;
// these are the one-click answers for "make it bigger".
const SIZE_PRESETS = [
	{ label: "S", value: 85 },
	{ label: "M", value: 100 },
	{ label: "L", value: 125 },
	{ label: "XL", value: 160 },
];

function clampNumber(raw: string, min: number, max: number, fallback: number) {
	return Math.min(max, Math.max(min, Number(raw) || fallback));
}

export function ConfigBuilder({ initialTheme }: { initialTheme?: Theme }) {
	const [config, setConfig] = useState<Config>(() =>
		initialTheme ? { ...DEFAULTS, theme: initialTheme } : DEFAULTS,
	);
	const [importDraft, setImportDraft] = useState("");

	const set = <K extends keyof Config>(key: K, value: Config[K]) =>
		setConfig((prev) => ({ ...prev, [key]: value }));

	const cleanChannel = config.channel.trim().toLowerCase().replace(/^@/, "");

	const url = useMemo(
		() =>
			buildOverlayUrl({
				channel: cleanChannel,
				theme: config.theme,
				bg: config.bg,
				size: config.size,
				max: config.max,
				delay: config.delay,
				fade: config.fade,
				hidebots: config.hidebots,
				hidecommands: config.hidecommands,
				timestamps: config.timestamps,
				badges: config.badges,
				animate: config.animate,
				pronouns: config.pronouns,
				hide: normalizeLoginList(config.hide),
				allow: normalizeLoginList(config.allow),
				badgeart: config.badgeart.trim(),
				badgegist: config.badgegist.trim(),
				refresh: config.refresh,
			}),
		[cleanChannel, config],
	);

	const copy = async () => {
		if (!cleanChannel) {
			toast.error("Enter your channel name first");
			return;
		}
		await navigator.clipboard.writeText(url);
		toast.success("Overlay URL copied, paste it into OBS");
	};

	const reset = () => {
		setConfig(DEFAULTS);
		setImportDraft("");
		toast.success("Reset to defaults");
	};

	// Load an existing overlay link back into the form. Anything the
	// schema rejects lands on its default, exactly as the overlay would
	// have rendered it, so a stale or hand-edited link still imports.
	const importUrl = () => {
		const parsed = parseOverlayUrl(importDraft);
		if (!parsed) {
			toast.error("That does not look like an overlay URL");
			return;
		}
		setConfig({
			channel: parsed.channel ?? "",
			theme: parsed.theme,
			bg: parsed.bg,
			size: parsed.size,
			max: parsed.max,
			delay: parsed.delay,
			fade: parsed.fade,
			hidebots: parsed.hidebots,
			hidecommands: parsed.hidecommands,
			timestamps: parsed.timestamps,
			badges: parsed.badges,
			animate: parsed.animate,
			pronouns: parsed.pronouns,
			hide: parsed.hide.join(", "),
			allow: parsed.allow.join(", "),
			badgeart: parsed.badgeart,
			badgegist: parsed.badgegist,
			refresh: parsed.refresh,
		});
		setImportDraft("");
		toast.success("Loaded, every control now matches that link");
	};

	return (
		<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			{/* left: sticky live preview + the URL it writes */}
			<div className="flex flex-col gap-4 lg:sticky lg:top-24">
				<div className="flex items-center justify-between">
					<span className={`text-[#7fd7ff] text-[0.65rem] ${MONO}`}>
						Live preview
					</span>
					<span
						className={`text-[0.65rem] text-[color:var(--site-txt-2)] ${MONO}`}
					>
						{BG_LABEL[config.bg]} / {THEME_LABEL[config.theme]} / {config.size}%
					</span>
				</div>
				<OverlayPreview
					animate={config.animate}
					backdrop="checker"
					bg={config.bg}
					className="h-96"
					fadeSeconds={config.fade}
					showBadges={config.badges}
					showPronouns={config.pronouns}
					showTimestamps={config.timestamps}
					size={config.size}
					theme={config.theme}
				/>

				{/* terminal-style readout: the whole config, as one URL */}
				<div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
					<div className="flex items-center gap-2 border-white/5 border-b px-3 py-2.5">
						<span className="size-2.5 rounded-full bg-[#ff5f57]" />
						<span className="size-2.5 rounded-full bg-[#febc2e]" />
						<span className="size-2.5 rounded-full bg-[#28c840]" />
						<span
							className={`ml-1 text-[0.65rem] text-[color:var(--site-txt-2)] ${MONO}`}
						>
							obs browser source
						</span>
					</div>
					<div className="break-all p-4 font-mono text-[#7fd7ff] text-sm leading-relaxed">
						{url}
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						className="hb-btn hb-btn-primary"
						onClick={copy}
						type="button"
					>
						<Copy className="size-4" /> Copy URL
					</button>
					<a
						className="hb-btn hb-btn-secondary"
						href={url}
						rel="noreferrer"
						target="_blank"
					>
						<ExternalLink className="size-4" /> Open preview
					</a>
					<button className="hb-btn hb-btn-ghost" onClick={reset} type="button">
						<RotateCcw className="size-4" /> Reset
					</button>
				</div>
			</div>

			{/* right: the controls, grouped */}
			<div className="flex flex-col gap-4">
				{/* import: the fastest path for anyone who already has an overlay */}
				<Fieldset
					hint="Already have an overlay in OBS? Paste that URL to load every setting here and keep editing."
					title="Start from an existing link"
				>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input
							aria-label="Existing overlay URL"
							autoComplete="off"
							className={cn(FIELD, "flex-1")}
							onChange={(e) => setImportDraft(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									importUrl();
								}
							}}
							placeholder="https://.../overlay?channel=you&theme=neon"
							value={importDraft}
						/>
						<button
							className="hb-btn hb-btn-secondary"
							disabled={!importDraft.trim()}
							onClick={importUrl}
							type="button"
						>
							<ClipboardPaste className="size-4" /> Load
						</button>
					</div>
				</Fieldset>

				<Fieldset title="Channel">
					<Field
						hint="Just the login name, no URL or @."
						htmlFor="cfg-channel"
						label="Twitch channel"
					>
						<Input
							autoComplete="off"
							className={FIELD}
							id="cfg-channel"
							onChange={(e) => set("channel", e.target.value)}
							placeholder="your_channel"
							value={config.channel}
						/>
					</Field>
				</Fieldset>

				<Fieldset title="Look">
					<Field hint="How the chat sits on your stream." label="Display mode">
						<div className="flex flex-wrap gap-2">
							{BG_MODES.map((mode) => (
								<button
									aria-pressed={config.bg === mode}
									className={cn(
										"hb-btn hb-btn-sm hb-btn-secondary",
										config.bg === mode && "hb-btn-selected",
									)}
									key={mode}
									onClick={() => set("bg", mode)}
									type="button"
								>
									{BG_LABEL[mode]}
								</button>
							))}
						</div>
					</Field>

					<Field label="Theme">
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{THEMES.map((t) => (
								<button
									aria-pressed={t === config.theme}
									className={cn(
										"flex min-h-11 items-center gap-2 rounded-[0.7rem] border px-3 text-left text-sm transition-colors",
										t === config.theme
											? "border-[#00ACED] bg-[#00ACED]/15 text-white"
											: "border-white/10 text-[color:var(--site-txt-2)] hover:border-white/30 hover:text-white",
									)}
									key={t}
									onClick={() => set("theme", t)}
									type="button"
								>
									<span
										className="size-4 shrink-0 rounded-full border border-white/20"
										style={{ background: THEME_SWATCH[t] }}
									/>
									<span className="truncate">{THEME_LABEL[t]}</span>
								</button>
							))}
						</div>
					</Field>

					{/* text size: presets for the common answer, slider for the rest */}
					<Field
						hint="Scales the theme's own text size, so a theme that ships smaller type stays proportionally smaller."
						htmlFor="cfg-size"
						label={`Text size (${config.size}%)`}
					>
						<div className="flex flex-wrap gap-2">
							{SIZE_PRESETS.map((preset) => (
								<button
									aria-pressed={config.size === preset.value}
									className={cn(
										"hb-btn hb-btn-sm hb-btn-secondary min-w-11",
										config.size === preset.value && "hb-btn-selected",
									)}
									key={preset.label}
									onClick={() => set("size", preset.value)}
									type="button"
								>
									{preset.label}
								</button>
							))}
						</div>
						<input
							className="mt-1 h-11 w-full accent-[#00ACED]"
							id="cfg-size"
							max={300}
							min={50}
							onChange={(e) => set("size", Number(e.target.value))}
							step={5}
							type="range"
							value={config.size}
						/>
					</Field>

					<Toggle
						checked={config.badges}
						id="cfg-badges"
						label="Show badges"
						onChange={(v) => set("badges", v)}
					/>
					<Toggle
						checked={config.pronouns}
						hint={
							<>
								Pronoun data from{" "}
								<a
									className="underline hover:text-white"
									href="https://pronouns.alejo.io/"
									rel="noreferrer"
									target="_blank"
								>
									pronouns.alejo.io
								</a>
								.
							</>
						}
						id="cfg-pronouns"
						label="Show pronouns"
						onChange={(v) => set("pronouns", v)}
					/>
					<Toggle
						checked={config.timestamps}
						id="cfg-timestamps"
						label="Show timestamps"
						onChange={(v) => set("timestamps", v)}
					/>
					<Toggle
						checked={config.animate}
						id="cfg-animate"
						label="Animate messages in"
						onChange={(v) => set("animate", v)}
					/>
				</Fieldset>

				<Fieldset title="Messages">
					<div className="grid gap-4 sm:grid-cols-2">
						<NumberField
							fallback={50}
							id="cfg-max"
							label="Max messages"
							max={200}
							min={1}
							onCommit={(v) => set("max", v)}
							value={config.max}
						/>
						<NumberField
							fallback={0}
							id="cfg-fade"
							label="Auto-hide after (s)"
							max={600}
							min={0}
							onCommit={(v) => set("fade", v)}
							value={config.fade}
						/>
					</div>
				</Fieldset>

				<Fieldset title="Moderation">
					<NumberField
						fallback={0}
						hint="Holds non-mod messages this long so deletes land first."
						id="cfg-delay"
						label="Mod delay (seconds)"
						max={300}
						min={0}
						onCommit={(v) => set("delay", v)}
						value={config.delay}
					/>
					<Toggle
						checked={config.hidebots}
						id="cfg-hidebots"
						label="Hide known bots (Nightbot, StreamElements, ...)"
						onChange={(v) => set("hidebots", v)}
					/>
					<Toggle
						checked={config.hidecommands}
						id="cfg-hidecommands"
						label="Hide !commands"
						onChange={(v) => set("hidecommands", v)}
					/>
					<Field htmlFor="cfg-hide" label="Hide these users">
						<Input
							autoComplete="off"
							className={FIELD}
							id="cfg-hide"
							onChange={(e) => set("hide", e.target.value)}
							placeholder="somebot, anotheruser"
							value={config.hide}
						/>
					</Field>
					<Field
						hint="When set, the overlay shows only these logins. Great for an on-stream shoutout corner."
						htmlFor="cfg-allow"
						label="Featured users only"
					>
						<Input
							autoComplete="off"
							className={FIELD}
							id="cfg-allow"
							onChange={(e) => set("allow", e.target.value)}
							placeholder="leave empty to show everyone"
							value={config.allow}
						/>
					</Field>
				</Fieldset>

				{/* the long tail, folded away: most streamers never open this */}
				<details className="hb-card group">
					<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5">
						<span className={`text-[0.65rem] text-white/60 ${MONO}`}>
							Custom badges and cache
						</span>
						<ChevronDown className="size-4 text-white/40 transition-transform group-open:rotate-180" />
					</summary>
					<div className="flex flex-col gap-4 px-5 pt-1 pb-5">
						<Field
							hint="Comma-separated set=url or set/version=url pairs. Overrides the default Twitch art (all global and channel badges load out of the box)."
							htmlFor="cfg-badgeart"
							label="Custom badge art"
						>
							<Input
								autoComplete="off"
								className={FIELD}
								id="cfg-badgeart"
								onChange={(e) => set("badgeart", e.target.value)}
								placeholder="moderator=https://example.com/mod.png"
								value={config.badgeart}
							/>
						</Field>
						<Field
							hint="A public GitHub gist holding the same set=url pairs (one per line) or a JSON map. Edit the gist to update badges without touching this URL."
							htmlFor="cfg-badgegist"
							label="Badge art gist"
						>
							<Input
								autoComplete="off"
								className={FIELD}
								id="cfg-badgegist"
								onChange={(e) => set("badgegist", e.target.value)}
								placeholder="https://gist.github.com/you/abc123..."
								value={config.badgegist}
							/>
						</Field>
						<NumberField
							fallback={0}
							hint="Re-fetches 7TV, BTTV, FFZ, and badge art mid-stream so new emotes appear without a reload. 0 turns it off."
							id="cfg-refresh"
							label="Refresh emote cache (minutes)"
							max={1440}
							min={0}
							onCommit={(v) => set("refresh", v)}
							value={config.refresh}
						/>
					</div>
				</details>
			</div>
		</div>
	);
}

function Fieldset({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="hb-card flex flex-col gap-4 p-5">
			{/* h2: the page h1 is "Configure your overlay"; skipping to h3
			    breaks the outline for screen readers */}
			<div className="flex flex-col gap-1.5">
				<h2 className={`text-[0.65rem] text-white/60 ${MONO}`}>{title}</h2>
				{hint && (
					<p className="text-[color:var(--site-txt-2)] text-sm leading-relaxed">
						{hint}
					</p>
				)}
			</div>
			{children}
		</section>
	);
}

// One label/control/hint stack, so every row in the form has the same
// spacing and every hint sits in the same place.
function Field({
	label,
	htmlFor,
	hint,
	children,
}: {
	label: string;
	htmlFor?: string;
	hint?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-2">
			{htmlFor ? (
				<Label htmlFor={htmlFor}>{label}</Label>
			) : (
				<span className="font-medium text-sm">{label}</span>
			)}
			{children}
			{hint && (
				<p className="text-[color:var(--site-txt-2)] text-xs leading-relaxed">
					{hint}
				</p>
			)}
		</div>
	);
}

// Number input that tolerates a cleared field while typing: the draft
// holds the raw text during editing (so backspace doesn't snap to the
// fallback), commits clamped values as they land, and re-syncs the
// display to the committed value on blur.
function NumberField({
	id,
	label,
	min,
	max,
	fallback,
	value,
	onCommit,
	hint,
}: {
	id: string;
	label: string;
	min: number;
	max: number;
	fallback: number;
	value: number;
	onCommit: (value: number) => void;
	hint?: string;
}) {
	const [draft, setDraft] = useState<string | null>(null);

	return (
		<Field hint={hint} htmlFor={id} label={label}>
			<Input
				className={FIELD}
				id={id}
				max={max}
				min={min}
				onBlur={() => setDraft(null)}
				onChange={(e) => {
					setDraft(e.target.value);
					if (e.target.value !== "") {
						onCommit(clampNumber(e.target.value, min, max, fallback));
					}
				}}
				type="number"
				value={draft ?? String(value)}
			/>
		</Field>
	);
}

function Toggle({
	id,
	label,
	checked,
	hint,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	hint?: React.ReactNode;
	onChange: (value: boolean) => void;
}) {
	return (
		<div className="grid gap-1">
			<div className="flex items-center gap-2.5">
				<Checkbox
					checked={checked}
					className="size-5 rounded-[0.3rem]"
					id={id}
					onCheckedChange={(value) => onChange(value === true)}
				/>
				<Label className="font-normal text-sm" htmlFor={id}>
					{label}
				</Label>
			</div>
			{hint && (
				<p className="pl-[1.875rem] text-[color:var(--site-txt-2)] text-xs leading-relaxed">
					{hint}
				</p>
			)}
		</div>
	);
}
