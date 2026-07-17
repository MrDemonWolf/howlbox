import { Button } from "@howlbox/ui/components/button";
import { Checkbox } from "@howlbox/ui/components/checkbox";
import { Input } from "@howlbox/ui/components/input";
import { Label } from "@howlbox/ui/components/label";
import { cn } from "@howlbox/ui/lib/utils";
import { Copy, ExternalLink, RotateCcw } from "lucide-react";
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
import { buildOverlayUrl } from "@/lib/overlay/url";

interface Config {
	channel: string;
	theme: Theme;
	bg: BgMode;
	max: number;
	delay: number;
	fade: number;
	hidebots: boolean;
	hidecommands: boolean;
	timestamps: boolean;
	badges: boolean;
	animate: boolean;
	hide: string;
	allow: string;
}

// Form state. The scalar/toggle defaults come from the shared
// OVERLAY_DEFAULTS so they can't drift from the overlay; hide/allow are
// raw comma strings here, normalized only when the URL is built.
const DEFAULTS: Config = {
	channel: "",
	theme: OVERLAY_DEFAULTS.theme,
	bg: OVERLAY_DEFAULTS.bg,
	max: OVERLAY_DEFAULTS.max,
	delay: OVERLAY_DEFAULTS.delay,
	fade: OVERLAY_DEFAULTS.fade,
	hidebots: OVERLAY_DEFAULTS.hidebots,
	hidecommands: OVERLAY_DEFAULTS.hidecommands,
	timestamps: OVERLAY_DEFAULTS.timestamps,
	badges: OVERLAY_DEFAULTS.badges,
	animate: OVERLAY_DEFAULTS.animate,
	hide: "",
	allow: "",
};

function clampNumber(raw: string, min: number, max: number, fallback: number) {
	return Math.min(max, Math.max(min, Number(raw) || fallback));
}

export function ConfigBuilder({ initialTheme }: { initialTheme?: Theme }) {
	const [config, setConfig] = useState<Config>(() =>
		initialTheme ? { ...DEFAULTS, theme: initialTheme } : DEFAULTS,
	);

	const set = <K extends keyof Config>(key: K, value: Config[K]) =>
		setConfig((prev) => ({ ...prev, [key]: value }));

	const cleanChannel = config.channel.trim().toLowerCase().replace(/^@/, "");

	const url = useMemo(
		() =>
			buildOverlayUrl({
				channel: cleanChannel,
				theme: config.theme,
				bg: config.bg,
				max: config.max,
				delay: config.delay,
				fade: config.fade,
				hidebots: config.hidebots,
				hidecommands: config.hidecommands,
				timestamps: config.timestamps,
				badges: config.badges,
				animate: config.animate,
				hide: normalizeLoginList(config.hide),
				allow: normalizeLoginList(config.allow),
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
		toast.success("Reset to defaults");
	};

	return (
		<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			{/* left: sticky live preview + the URL it writes */}
			<div className="flex flex-col gap-4 lg:sticky lg:top-24">
				<div className="flex items-center justify-between">
					<span className={`text-[#7fd7ff] text-[0.65rem] ${MONO}`}>
						Live preview
					</span>
					<span className={`text-[0.65rem] text-white/50 ${MONO}`}>
						{BG_LABEL[config.bg]} / {THEME_LABEL[config.theme]}
					</span>
				</div>
				<OverlayPreview
					animate={config.animate}
					backdrop="checker"
					bg={config.bg}
					className="h-96"
					fadeSeconds={config.fade}
					showBadges={config.badges}
					showTimestamps={config.timestamps}
					theme={config.theme}
				/>

				{/* terminal-style readout: the whole config, as one URL */}
				<div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
					<div className="flex items-center gap-2 border-white/5 border-b px-3 py-2.5">
						<span className="size-2.5 rounded-full bg-[#ff5f57]" />
						<span className="size-2.5 rounded-full bg-[#febc2e]" />
						<span className="size-2.5 rounded-full bg-[#28c840]" />
						<span className={`ml-1 text-[0.65rem] text-white/55 ${MONO}`}>
							obs browser source
						</span>
					</div>
					<div className="break-all p-4 font-mono text-[#7fd7ff] text-sm leading-relaxed">
						{url}
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button className="gap-2" onClick={copy} type="button">
						<Copy className="size-4" /> Copy URL
					</Button>
					<a
						className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						href={url}
						rel="noreferrer"
						target="_blank"
					>
						<ExternalLink className="size-4" /> Preview
					</a>
					<Button
						className="gap-2"
						onClick={reset}
						type="button"
						variant="ghost"
					>
						<RotateCcw className="size-4" /> Reset
					</Button>
				</div>
			</div>

			{/* right: the controls, grouped */}
			<div className="flex flex-col gap-5">
				<Fieldset title="Channel">
					<div className="grid gap-2">
						<Label htmlFor="cfg-channel">Twitch channel</Label>
						<Input
							autoComplete="off"
							id="cfg-channel"
							onChange={(e) => set("channel", e.target.value)}
							placeholder="your_channel"
							value={config.channel}
						/>
						<p className="text-muted-foreground text-xs">
							Just the login name, no URL or @.
						</p>
					</div>
				</Fieldset>

				<Fieldset title="Look">
					<div className="grid gap-2">
						<Label>Display mode</Label>
						<div className="flex gap-2">
							{BG_MODES.map((mode) => (
								<Button
									key={mode}
									onClick={() => set("bg", mode)}
									size="sm"
									type="button"
									variant={config.bg === mode ? "default" : "outline"}
								>
									{BG_LABEL[mode]}
								</Button>
							))}
						</div>
					</div>
					<div className="grid gap-2">
						<Label>Theme</Label>
						<div className="flex flex-wrap gap-1.5">
							{THEMES.map((t) => (
								<button
									className={cn(
										"flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
										t === config.theme
											? "border-[#00ACED] bg-[#00ACED]/15 text-foreground"
											: "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
									)}
									key={t}
									onClick={() => set("theme", t)}
									type="button"
								>
									<span
										className="size-3 rounded-full border border-white/20"
										style={{ background: THEME_SWATCH[t] }}
									/>
									{THEME_LABEL[t]}
								</button>
							))}
						</div>
					</div>
					<Toggle
						checked={config.badges}
						id="cfg-badges"
						label="Show badges"
						onChange={(v) => set("badges", v)}
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
					<div className="grid grid-cols-2 gap-4">
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
							label="Auto-hide after (s, 0 = never)"
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
					<div className="grid gap-2">
						<Label htmlFor="cfg-hide">Hide these users</Label>
						<Input
							autoComplete="off"
							id="cfg-hide"
							onChange={(e) => set("hide", e.target.value)}
							placeholder="somebot, anotheruser"
							value={config.hide}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="cfg-allow">Featured users only</Label>
						<Input
							autoComplete="off"
							id="cfg-allow"
							onChange={(e) => set("allow", e.target.value)}
							placeholder="leave empty to show everyone"
							value={config.allow}
						/>
						<p className="text-muted-foreground text-xs">
							When set, the overlay shows only these logins. Great for an
							on-stream shoutout corner.
						</p>
					</div>
				</Fieldset>
			</div>
		</div>
	);
}

function Fieldset({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
			{/* h2: the page h1 is "Configure your overlay"; skipping to h3
			    breaks the outline for screen readers */}
			<h2 className={`text-[0.65rem] text-white/60 ${MONO}`}>{title}</h2>
			{children}
		</section>
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
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
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
			{hint && <p className="text-muted-foreground text-xs">{hint}</p>}
		</div>
	);
}

function Toggle({
	id,
	label,
	checked,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<Checkbox
				checked={checked}
				id={id}
				onCheckedChange={(value) => onChange(value === true)}
			/>
			<Label className="font-normal" htmlFor={id}>
				{label}
			</Label>
		</div>
	);
}
