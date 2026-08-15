// The configurator's left column: the sticky live preview, the URL
// readout, and the Copy / Open preview / Reset actions. Copy and the
// manual-copy fallback live here because they own the URL readout node.

import { cn } from "@howlbox/ui/lib/utils";
import { Copy, ExternalLink, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import {
	OBS_DIMENSIONS,
	OverlayPreview,
} from "@/components/landing/overlay-preview";
import { MONO } from "@/components/landing/site-chrome";

import type { Config } from "./form-model";

export function ConfigOutput({
	config,
	url,
	channelReady,
	channelInvalid,
	settled,
	onReset,
}: {
	config: Config;
	url: string;
	channelReady: boolean;
	channelInvalid: boolean;
	settled: string;
	onReset: () => void;
}) {
	// Select the generated URL text so a failed clipboard write still lets
	// the user copy it manually.
	const urlRef = useRef<HTMLElement>(null);
	const selectUrlReadout = () => {
		const node = urlRef.current;
		if (!node) {
			return;
		}
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(node);
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	// copy is disabled until the channel is valid, so the button can't fire
	// empty; the guard stays as a keyboard/programmatic backstop. The
	// clipboard write can reject (denied permission, insecure context, OBS'
	// embedded browser), so fall back to selecting the URL readout and tell
	// the user to copy it by hand instead of dropping the click silently.
	const copy = async () => {
		if (!channelReady) {
			return;
		}
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Overlay URL copied, paste it into OBS");
		} catch {
			selectUrlReadout();
			toast.error(
				"Could not copy automatically, the URL is selected, press Ctrl+C",
			);
		}
	};

	return (
		<div className="order-2 flex flex-col gap-4 lg:sticky lg:top-24 lg:order-1">
			<div className="flex items-center justify-between">
				<span
					className={`text-[0.65rem] text-[color:var(--site-brand-text)] ${MONO}`}
				>
					Live preview · {OBS_DIMENSIONS}
				</span>
				{/* This line already mirrors the state a sighted user reads off
				    the preview, so it doubles as the status region rather than
				    announcing the whole URL. Debounced, or dragging the size
				    slider fires an announcement per pixel. */}
				<span
					className={`text-[0.65rem] text-[color:var(--site-txt-2)] ${MONO}`}
					role="status"
				>
					{settled}
				</span>
			</div>
			<OverlayPreview
				animate={config.animate}
				backdrop="checker"
				bg={config.bg}
				avatarMode={config.avatars}
				className="h-[34rem]"
				events={config.events}
				logicalViewport
				fadeSeconds={config.fade}
				maxMessages={config.max}
				mediaMode={config.media}
				showBadges={config.badges}
				showPronouns={config.pronouns}
				showTimestamps={config.timestamps}
				emoteScale={config.emotescale}
				size={config.size}
				theme={config.theme}
				variant={config.variant}
			/>

			{/* terminal-style readout: the whole config, as one URL */}
			<div className="hb-hairline overflow-hidden rounded-xl border bg-[color:var(--site-surface)]">
				<div className="hb-hairline flex items-center gap-2 border-b px-3 py-2.5">
					<span className="size-2.5 rounded-full bg-[#ff5f57]" />
					<span className="size-2.5 rounded-full bg-[#febc2e]" />
					<span className="size-2.5 rounded-full bg-[#28c840]" />
					<span
						className={`ml-1 text-[0.65rem] text-[color:var(--site-txt-2)] ${MONO}`}
					>
						obs browser source
					</span>
				</div>
				{/* labelled so it is identifiable when tabbing or browsing by
				    region; the announcement itself is the debounced status
				    below, because reading a 200-character URL aloud on every
				    keystroke would be unusable */}
				<section
					aria-label="Generated overlay URL"
					className="break-all p-4 font-mono text-[color:var(--site-brand-text)] text-sm leading-relaxed"
					ref={urlRef}
				>
					{url}
				</section>
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					className="hb-btn hb-btn-primary"
					disabled={!channelReady}
					onClick={copy}
					type="button"
				>
					<Copy className="size-4" /> Copy URL
				</button>
				<a
					aria-disabled={!channelReady}
					className={cn(
						"hb-btn hb-btn-secondary",
						!channelReady && "pointer-events-none opacity-50",
					)}
					href={url}
					rel="noreferrer"
					tabIndex={channelReady ? undefined : -1}
					target="_blank"
				>
					<ExternalLink className="size-4" /> Open preview
				</a>
				<button className="hb-btn hb-btn-ghost" onClick={onReset} type="button">
					<RotateCcw className="size-4" /> Reset
				</button>
			</div>
			{!channelReady && (
				<p className="text-[color:var(--site-txt-2)] text-xs">
					{channelInvalid
						? "That is not a valid Twitch channel name. Use 1 to 25 letters, numbers or underscores."
						: "Enter your channel above to copy or open the overlay."}
				</p>
			)}
		</div>
	);
}
