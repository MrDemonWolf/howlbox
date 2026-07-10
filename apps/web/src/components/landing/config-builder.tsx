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
import { BG_MODES, THEMES } from "@/lib/overlay/params";
import { BG_LABEL, THEME_LABEL, THEME_SWATCH } from "@/lib/overlay/theme-meta";

type Theme = (typeof THEMES)[number];
type BgMode = (typeof BG_MODES)[number];

const DEFAULTS = {
	channel: "",
	theme: "wolf" as Theme,
	bg: "off" as BgMode,
	max: 50,
	delay: 0,
	fade: 0,
	hidebots: false,
	hidecommands: false,
	timestamps: false,
	badges: true,
	animate: true,
	hide: "",
	allow: "",
};

function clampNumber(raw: string, min: number, max: number, fallback: number) {
	return Math.min(max, Math.max(min, Number(raw) || fallback));
}

// keep only valid Twitch login shapes from a comma list
function normalizeLogins(raw: string) {
	return raw
		.split(",")
		.map((login) => login.trim().toLowerCase())
		.filter(Boolean)
		.join(",");
}

export function ConfigBuilder() {
	const [channel, setChannel] = useState(DEFAULTS.channel);
	const [theme, setTheme] = useState<Theme>(DEFAULTS.theme);
	const [bg, setBg] = useState<BgMode>(DEFAULTS.bg);
	const [max, setMax] = useState(DEFAULTS.max);
	const [delay, setDelay] = useState(DEFAULTS.delay);
	const [fade, setFade] = useState(DEFAULTS.fade);
	const [hidebots, setHidebots] = useState(DEFAULTS.hidebots);
	const [hidecommands, setHidecommands] = useState(DEFAULTS.hidecommands);
	const [timestamps, setTimestamps] = useState(DEFAULTS.timestamps);
	const [badges, setBadges] = useState(DEFAULTS.badges);
	const [animate, setAnimate] = useState(DEFAULTS.animate);
	const [hide, setHide] = useState(DEFAULTS.hide);
	const [allow, setAllow] = useState(DEFAULTS.allow);

	const cleanChannel = channel.trim().toLowerCase().replace(/^@/, "");

	const url = useMemo(() => {
		const qs = new URLSearchParams();
		qs.set("channel", cleanChannel || "your_channel");
		if (theme !== DEFAULTS.theme) {
			qs.set("theme", theme);
		}
		if (bg !== DEFAULTS.bg) {
			qs.set("bg", bg);
		}
		if (max !== DEFAULTS.max) {
			qs.set("max", String(max));
		}
		if (delay > 0) {
			qs.set("delay", String(delay));
		}
		if (hidebots) {
			qs.set("hidebots", "true");
		}
		const hideList = normalizeLogins(hide);
		if (hideList) {
			qs.set("hide", hideList);
		}
		const allowList = normalizeLogins(allow);
		if (allowList) {
			qs.set("allow", allowList);
		}
		if (hidecommands) {
			qs.set("hidecommands", "true");
		}
		if (timestamps) {
			qs.set("timestamps", "true");
		}
		if (!badges) {
			qs.set("badges", "false");
		}
		if (!animate) {
			qs.set("animate", "false");
		}
		if (fade > 0) {
			qs.set("fade", String(fade));
		}
		return `${window.location.origin}${import.meta.env.BASE_URL}overlay?${qs.toString()}`;
	}, [
		cleanChannel,
		theme,
		bg,
		max,
		delay,
		fade,
		hidebots,
		hidecommands,
		timestamps,
		badges,
		animate,
		hide,
		allow,
	]);

	const copy = async () => {
		if (!cleanChannel) {
			toast.error("Enter your channel name first");
			return;
		}
		await navigator.clipboard.writeText(url);
		toast.success("Overlay URL copied, paste it into OBS");
	};

	const reset = () => {
		setChannel(DEFAULTS.channel);
		setTheme(DEFAULTS.theme);
		setBg(DEFAULTS.bg);
		setMax(DEFAULTS.max);
		setDelay(DEFAULTS.delay);
		setFade(DEFAULTS.fade);
		setHidebots(DEFAULTS.hidebots);
		setHidecommands(DEFAULTS.hidecommands);
		setTimestamps(DEFAULTS.timestamps);
		setBadges(DEFAULTS.badges);
		setAnimate(DEFAULTS.animate);
		setHide(DEFAULTS.hide);
		setAllow(DEFAULTS.allow);
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
					<span className={`text-[0.6rem] text-white/35 ${MONO}`}>
						{BG_LABEL[bg]} / {THEME_LABEL[theme]}
					</span>
				</div>
				<OverlayPreview
					animate={animate}
					backdrop="checker"
					bg={bg}
					className="h-96"
					fadeSeconds={fade}
					showBadges={badges}
					showTimestamps={timestamps}
					theme={theme}
				/>

				{/* terminal-style readout: the whole config, as one URL */}
				<div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
					<div className="flex items-center gap-2 border-white/5 border-b px-3 py-2.5">
						<span className="size-2.5 rounded-full bg-[#ff5f57]" />
						<span className="size-2.5 rounded-full bg-[#febc2e]" />
						<span className="size-2.5 rounded-full bg-[#28c840]" />
						<span className={`ml-1 text-[0.6rem] text-white/55 ${MONO}`}>
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
							onChange={(e) => setChannel(e.target.value)}
							placeholder="your_channel"
							value={channel}
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
									onClick={() => setBg(mode)}
									size="sm"
									type="button"
									variant={bg === mode ? "default" : "outline"}
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
										t === theme
											? "border-[#00ACED] bg-[#00ACED]/15 text-foreground"
											: "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
									)}
									key={t}
									onClick={() => setTheme(t)}
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
						checked={badges}
						id="cfg-badges"
						label="Show badges"
						onChange={setBadges}
					/>
					<Toggle
						checked={timestamps}
						id="cfg-timestamps"
						label="Show timestamps"
						onChange={setTimestamps}
					/>
					<Toggle
						checked={animate}
						id="cfg-animate"
						label="Animate messages in"
						onChange={setAnimate}
					/>
				</Fieldset>

				<Fieldset title="Messages">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="cfg-max">Max messages</Label>
							<Input
								id="cfg-max"
								max={200}
								min={1}
								onChange={(e) =>
									setMax(clampNumber(e.target.value, 1, 200, 50))
								}
								type="number"
								value={max}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="cfg-fade">Auto-hide after (s, 0 = never)</Label>
							<Input
								id="cfg-fade"
								max={600}
								min={0}
								onChange={(e) =>
									setFade(clampNumber(e.target.value, 0, 600, 0))
								}
								type="number"
								value={fade}
							/>
						</div>
					</div>
				</Fieldset>

				<Fieldset title="Moderation">
					<div className="grid gap-2">
						<Label htmlFor="cfg-delay">Mod delay (seconds)</Label>
						<Input
							id="cfg-delay"
							max={300}
							min={0}
							onChange={(e) => setDelay(clampNumber(e.target.value, 0, 300, 0))}
							type="number"
							value={delay}
						/>
						<p className="text-muted-foreground text-xs">
							Holds non-mod messages this long so deletes land first.
						</p>
					</div>
					<Toggle
						checked={hidebots}
						id="cfg-hidebots"
						label="Hide known bots (Nightbot, StreamElements, ...)"
						onChange={setHidebots}
					/>
					<Toggle
						checked={hidecommands}
						id="cfg-hidecommands"
						label="Hide !commands"
						onChange={setHidecommands}
					/>
					<div className="grid gap-2">
						<Label htmlFor="cfg-hide">Hide these users</Label>
						<Input
							autoComplete="off"
							id="cfg-hide"
							onChange={(e) => setHide(e.target.value)}
							placeholder="somebot, anotheruser"
							value={hide}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="cfg-allow">Featured users only</Label>
						<Input
							autoComplete="off"
							id="cfg-allow"
							onChange={(e) => setAllow(e.target.value)}
							placeholder="leave empty to show everyone"
							value={allow}
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
			<h3 className={`text-[0.65rem] text-white/60 ${MONO}`}>{title}</h3>
			{children}
		</section>
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
