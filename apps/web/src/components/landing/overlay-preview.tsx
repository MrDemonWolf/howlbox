import { ChatMessageRow } from "@/components/chat/chat-message";
import { LIGHT_SURFACE_THEMES } from "@/components/chat/chat-overlay";
import { useDemoStream } from "@/components/landing/demo-messages";
import type { BG_MODES, THEMES } from "@/lib/overlay/params";

import "@/components/chat/overlay.css";

type Theme = (typeof THEMES)[number];
type BgMode = (typeof BG_MODES)[number];

interface OverlayPreviewProps {
	theme: Theme;
	bg: BgMode;
	showBadges: boolean;
	showTimestamps: boolean;
	animate: boolean;
	fadeSeconds: number;
	className?: string;
	// "checker" shows the transparency checkerboard (honest OBS view);
	// "gameplay" fakes a game feed to sell legibility over video
	backdrop?: "checker" | "gameplay";
}

// mirrors ChatOverlay's markup but scoped to a card (absolute, not
// fixed) and layered over a gameplay stand-in, so bg=off transparency
// reads honestly.
const PANEL_CLASSES =
	"m-2 rounded-(--hb-radius) border border-(--hb-border) p-3 [background:var(--hb-surface)] [box-shadow:var(--hb-shadow)]";

export function OverlayPreview({
	theme,
	bg,
	showBadges,
	showTimestamps,
	animate,
	fadeSeconds,
	className = "h-105",
	backdrop = "gameplay",
}: OverlayPreviewProps) {
	const messages = useDemoStream(8);
	const surfaceTone =
		bg !== "off" && LIGHT_SURFACE_THEMES.has(theme) ? "light" : "dark";

	return (
		<div
			className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${className}`}
		>
			{/* backdrop behind the (possibly transparent) overlay */}
			<div
				className={`absolute inset-0 ${
					backdrop === "checker"
						? "hb-checker"
						: "bg-[linear-gradient(135deg,#1b2735_0%,#2d4a3e_38%,#6b4f2e_72%,#3d2b4f_100%)]"
				}`}
			/>
			<div
				className="hb-root absolute inset-0 flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:var(--hb-font-size)]"
				data-bg={bg}
				data-theme={theme}
			>
				<div
					className={`hb-messages flex min-h-0 flex-col justify-end overflow-hidden p-2 [mask-image:var(--hb-mask)] ${
						bg === "bubble" ? "gap-1.5" : "gap-1"
					} ${bg === "panel" ? PANEL_CLASSES : ""}`}
				>
					{messages.map((message) => (
						<ChatMessageRow
							animate={animate}
							bg={bg}
							fadeSeconds={fadeSeconds}
							key={message.id}
							message={message}
							showBadges={showBadges}
							showTimestamps={showTimestamps}
							surfaceTone={surfaceTone}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
