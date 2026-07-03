import { Button } from "@howlbox/ui/components/button";
import { Checkbox } from "@howlbox/ui/components/checkbox";
import { Input } from "@howlbox/ui/components/input";
import { Label } from "@howlbox/ui/components/label";
import { Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BG_MODES, THEMES } from "@/lib/overlay/params";

type Theme = (typeof THEMES)[number];
type BgMode = (typeof BG_MODES)[number];

// swatch dot per theme so the picker reads at a glance
const THEME_SWATCH: Record<Theme, string> = {
	wolf: "linear-gradient(135deg,#132856,#091533 60%,#00ACED)",
	glass: "linear-gradient(135deg,#e8e8ee,#3a3d48)",
	terminal: "linear-gradient(135deg,#06130a,#4af680)",
	neon: "linear-gradient(135deg,#2c104e,#ff2db4)",
	dark: "linear-gradient(135deg,#1a1a1e,#4a4a52)",
	light: "linear-gradient(135deg,#ffffff,#c9d2e0)",
	contrast: "linear-gradient(135deg,#000000 55%,#ffffff 55%)",
	cozy: "linear-gradient(135deg,#ffe2f0,#e4dcff)",
	nobox: "linear-gradient(135deg,#0e1116,#ffffff)",
	retro95: "linear-gradient(135deg,#c0c0c0 65%,#000080)",
	arcade: "linear-gradient(135deg,#140e2e,#ffd23f)",
	galaxy: "linear-gradient(135deg,#582c8a,#0a0a24)",
	mocha: "linear-gradient(135deg,#f3e8da,#8a5a3b)",
};

const BG_LABEL: Record<BgMode, string> = {
	off: "Transparent",
	panel: "Panel",
	bubble: "Bubbles",
};

export function Generator() {
	const [channel, setChannel] = useState("");
	const [theme, setTheme] = useState<Theme>("wolf");
	const [bg, setBg] = useState<BgMode>("off");
	const [max, setMax] = useState(50);
	const [delay, setDelay] = useState(0);
	const [hidebots, setHidebots] = useState(false);
	const [hide, setHide] = useState("");
	const [hidecommands, setHidecommands] = useState(false);
	const [timestamps, setTimestamps] = useState(false);
	const [badges, setBadges] = useState(true);
	const [animate, setAnimate] = useState(true);
	const [fade, setFade] = useState(0);

	const cleanChannel = channel.trim().toLowerCase().replace(/^@/, "");

	const url = useMemo(() => {
		const qs = new URLSearchParams();
		qs.set("channel", cleanChannel || "your_channel");
		if (theme !== "wolf") {
			qs.set("theme", theme);
		}
		if (bg !== "off") {
			qs.set("bg", bg);
		}
		if (max !== 50) {
			qs.set("max", String(max));
		}
		if (delay > 0) {
			qs.set("delay", String(delay));
		}
		if (hidebots) {
			qs.set("hidebots", "true");
		}
		const hideList = hide
			.split(",")
			.map((login) => login.trim().toLowerCase())
			.filter(Boolean)
			.join(",");
		if (hideList) {
			qs.set("hide", hideList);
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
		hidebots,
		hide,
		hidecommands,
		timestamps,
		badges,
		animate,
		fade,
	]);

	const copy = async () => {
		if (!cleanChannel) {
			toast.error("Enter your channel name first");
			return;
		}
		await navigator.clipboard.writeText(url);
		toast.success("Overlay URL copied, paste it into OBS");
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
			<div className="flex flex-col gap-5">
				<div className="grid gap-2">
					<Label htmlFor="gen-channel">Twitch channel</Label>
					<Input
						autoComplete="off"
						id="gen-channel"
						onChange={(e) => setChannel(e.target.value)}
						placeholder="your_channel"
						value={channel}
					/>
				</div>

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
								className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
									t === theme
										? "border-[#00ACED] bg-[#00ACED]/15 text-foreground"
										: "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
								}`}
								key={t}
								onClick={() => setTheme(t)}
								type="button"
							>
								<span
									className="size-3 rounded-full border border-white/20"
									style={{ background: THEME_SWATCH[t] }}
								/>
								{t}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor="gen-max">Max messages</Label>
						<Input
							id="gen-max"
							max={200}
							min={1}
							onChange={(e) =>
								setMax(Math.min(200, Math.max(1, Number(e.target.value) || 50)))
							}
							type="number"
							value={max}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="gen-delay">Mod delay (seconds)</Label>
						<Input
							id="gen-delay"
							max={300}
							min={0}
							onChange={(e) =>
								setDelay(
									Math.min(300, Math.max(0, Number(e.target.value) || 0)),
								)
							}
							type="number"
							value={delay}
						/>
					</div>
				</div>

				<div className="grid gap-2.5">
					<div className="flex items-center gap-2">
						<Checkbox
							checked={hidebots}
							id="gen-hidebots"
							onCheckedChange={(checked) => setHidebots(checked === true)}
						/>
						<Label className="font-normal" htmlFor="gen-hidebots">
							Hide known bots (Nightbot, StreamElements, ...)
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={hidecommands}
							id="gen-hidecommands"
							onCheckedChange={(checked) => setHidecommands(checked === true)}
						/>
						<Label className="font-normal" htmlFor="gen-hidecommands">
							Hide !commands
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={timestamps}
							id="gen-timestamps"
							onCheckedChange={(checked) => setTimestamps(checked === true)}
						/>
						<Label className="font-normal" htmlFor="gen-timestamps">
							Show timestamps
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={badges}
							id="gen-badges"
							onCheckedChange={(checked) => setBadges(checked === true)}
						/>
						<Label className="font-normal" htmlFor="gen-badges">
							Show badges
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={animate}
							id="gen-animate"
							onCheckedChange={(checked) => setAnimate(checked === true)}
						/>
						<Label className="font-normal" htmlFor="gen-animate">
							Animate messages in
						</Label>
					</div>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="gen-fade">Auto-hide after (seconds, 0 = never)</Label>
					<Input
						id="gen-fade"
						max={600}
						min={0}
						onChange={(e) =>
							setFade(Math.min(600, Math.max(0, Number(e.target.value) || 0)))
						}
						type="number"
						value={fade}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="gen-hide">Also hide these users</Label>
					<Input
						autoComplete="off"
						id="gen-hide"
						onChange={(e) => setHide(e.target.value)}
						placeholder="somebot, anotheruser"
						value={hide}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<Label>Your OBS browser source URL</Label>
				<div className="break-all rounded-lg border border-border bg-black/30 p-4 font-mono text-[#7fd7ff] text-sm leading-relaxed">
					{url}
				</div>
				<div className="flex gap-2">
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
				</div>
				<p className="text-muted-foreground text-sm">
					Every option lives in the URL itself. No accounts, no dashboards,
					nothing stored. Change an option, copy again, paste into OBS.
				</p>
			</div>
		</div>
	);
}
