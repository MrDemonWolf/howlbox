// The configurator's left column: the sticky live preview, the URL
// readout, and the Copy / Open preview / Reset actions. Copy and the
// manual-copy fallback live here because they own the URL readout node.

import { cn } from "@howlbox/ui/lib/utils";
import {
	AlertCircle,
	Copy,
	ExternalLink,
	MessagesSquare,
	RotateCcw,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import {
	OverlayPreview,
	PREVIEW_DIMENSIONS,
} from "@/components/landing/overlay-preview";
import { MONO } from "@/components/landing/site-chrome";
import type { OverlayConfig } from "@/lib/overlay/url";

import { Toggle } from "./fields";
import type { Config } from "./form-model";

export function ConfigOutput({
	config,
	url,
	channelReady,
	channelInvalid,
	settled,
	testUrl,
	liveChat,
	liveConfig,
	onLiveChatChange,
	onReset,
}: {
	config: Config;
	liveChat: boolean;
	liveConfig: OverlayConfig;
	onLiveChatChange: (value: boolean) => void;
	url: string;
	testUrl: string;
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

	// Same settings plus ?demo, so the source can be placed in OBS on the
	// canned chat. No channel needed, so it is never disabled.
	const copyTestUrl = async () => {
		try {
			await navigator.clipboard.writeText(testUrl);
			toast.success("Test URL copied, paste it into OBS to place the source");
		} catch {
			toast.error(
				"Could not copy automatically. Copy the URL above and add &demo=true to the end",
			);
		}
	};

	return (
		<div className="order-2 flex flex-col gap-4 lg:sticky lg:top-24 lg:order-1">
			<div className="flex items-center justify-between">
				<span
					className={`text-[0.65rem] text-[color:var(--site-brand-text)] ${MONO}`}
				>
					Live preview · {PREVIEW_DIMENSIONS}
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
			<Toggle
				checked={liveChat}
				hint={
					liveChat && !channelReady
						? "Enter a valid channel to connect. When editing, the preview stays on the last valid channel until the new name settles."
						: "Off shows the demo chat, including MrDemonWolf. On connects to the channel above."
				}
				id="cfg-live-chat-preview"
				label="Use live Twitch chat"
				onChange={onLiveChatChange}
			/>
			<OverlayPreview
				animate={config.animate}
				backdrop="checker"
				bg={config.bg}
				avatarMode={config.avatars}
				className="mx-auto aspect-square w-full max-w-[30rem]"
				events={config.events}
				logicalViewport
				fadeSeconds={config.fade}
				maxMessages={config.max}
				liveChat={liveChat}
				liveConfig={liveConfig}
				mediaMode={config.media}
				showBadges={config.badges}
				showPronouns={config.pronouns}
				showTimestamps={config.timestamps}
				align={config.align}
				emoteScale={config.emotescale}
				group={config.group}
				layout={config.layout}
				scroll={config.scroll}
				scrollSpeed={config.scrollspeed}
				size={config.size}
				theme={config.theme}
				variant={config.variant}
			/>

			{/* terminal-style readout: the whole config, as one URL */}
			<div className="hb-hairline overflow-hidden rounded-xl border bg-[color:var(--site-surface)]">
				<div className="hb-hairline flex items-center gap-2 border-b px-3 py-2.5">
					<span className="size-2.5 rounded-full bg-[#ff5f57] max-sm:hidden" />
					<span className="size-2.5 rounded-full bg-[#febc2e] max-sm:hidden" />
					<span className="size-2.5 rounded-full bg-[#28c840] max-sm:hidden" />
					{/* the dots are decoration; on a phone they give way so the
					    label and Reset share one line */}
					<span
						className={`whitespace-nowrap text-[0.65rem] text-[color:var(--site-txt-2)] sm:ml-1 ${MONO}`}
					>
						obs browser source
					</span>
					{/* Reset clears the config this card spells out, so it lives
					    in the card's own chrome: quiet, and never next to Copy
					    where a slip would wipe the form. It also keeps the
					    action row to two buttons, which is what lets that row
					    hold one line on a 320px phone. 28px tall clears the
					    WCAG 2.5.8 24px target without growing the bar. */}
					<button
						className="-my-1 ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[color:var(--site-txt-2)] text-xs transition-colors hover:bg-[color:var(--site-elev)] hover:text-[color:var(--site-txt-1)]"
						onClick={onReset}
						type="button"
					>
						<RotateCcw aria-hidden="true" className="size-3.5" />
						Reset
					</button>
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

			{/* The real link's two actions, a matched pair under the
			    readout they act on. At 320px the row has 272px and the pair
			    measures 271 with icons, too tight to trust across fonts, so
			    icons drop below 380px; "Open preview" shortens below sm.
			    Swaps ride inner elements: .hb-btn is unlayered CSS and would
			    beat a display utility on the button itself. */}
			<div className="flex gap-2">
				<button
					className="hb-btn hb-btn-primary flex-1"
					disabled={!channelReady}
					onClick={copy}
					type="button"
				>
					<Copy aria-hidden="true" className="size-4 max-[379px]:hidden" />
					Copy URL
				</button>
				<a
					aria-disabled={!channelReady}
					className={cn(
						"hb-btn hb-btn-secondary flex-1",
						!channelReady && "pointer-events-none opacity-50",
					)}
					href={url}
					rel="noreferrer"
					tabIndex={channelReady ? undefined : -1}
					target="_blank"
				>
					<ExternalLink
						aria-hidden="true"
						className="size-4 max-[379px]:hidden"
					/>
					<span className="sm:hidden">Preview</span>
					<span className="max-sm:hidden">Open preview</span>
				</a>
			</div>
			{/* Copy and Open are disabled without a channel, and a disabled
			    button explains nothing on its own. Say what is missing, in
			    error styling, next to the control it blocks. The button
			    focuses the field so the fix is one click from here. */}
			{!channelReady && (
				<div
					className="hb-hairline flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[color:var(--site-danger,#e5484d)]/40 px-3 py-2 text-[color:var(--site-danger,#e5484d)] text-xs"
					role="alert"
				>
					<AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
					<span>
						{channelInvalid
							? "That is not a valid Twitch channel name. Use 1 to 25 letters, numbers or underscores."
							: "Twitch channel is required before you can copy or open the overlay."}
					</span>
					<button
						className="underline underline-offset-2"
						onClick={() => {
							const field = document.getElementById("cfg-channel");
							field?.scrollIntoView({ block: "center" });
							field?.focus();
						}}
						type="button"
					>
						Go to the field
					</button>
				</div>
			)}

			{/* Placement is a different job from going live, so the test
			    link gets its own strip and says what it is, instead of a
			    fourth button in the row above. Never disabled: demo needs
			    no channel. */}
			<div className="hb-hairline flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border px-4 py-3">
				<p className="min-w-0 flex-1 basis-[15rem] text-[color:var(--site-txt-2)] text-sm leading-snug">
					<span className="text-[color:var(--site-txt-1)]">
						Placing the source in OBS first?
					</span>{" "}
					The test URL plays sample chat with these settings. Delete{" "}
					<code className="font-mono text-[0.8125rem]">&amp;demo=true</code>{" "}
					from it to go live.
				</p>
				<button
					className="hb-btn hb-btn-secondary hb-btn-sm shrink-0"
					onClick={copyTestUrl}
					type="button"
				>
					<MessagesSquare className="size-4" /> Copy test URL
				</button>
			</div>
		</div>
	);
}
