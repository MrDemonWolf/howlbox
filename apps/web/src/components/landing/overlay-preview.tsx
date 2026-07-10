import { cn } from "@howlbox/ui/lib/utils";

import { MessageList } from "@/components/chat/message-list";
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

// Wraps the shared MessageList in a card (absolute, not fixed) layered
// over a gameplay stand-in, so bg=off transparency reads honestly.
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

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl",
				className,
			)}
		>
			{/* backdrop behind the (possibly transparent) overlay */}
			<div
				className={cn(
					"absolute inset-0",
					backdrop === "checker"
						? "hb-checker"
						: "bg-[linear-gradient(135deg,#1b2735_0%,#2d4a3e_38%,#6b4f2e_72%,#3d2b4f_100%)]",
				)}
			/>
			<div
				className="hb-root absolute inset-0 flex flex-col justify-end overflow-hidden text-(--hb-text) leading-snug [font-family:var(--hb-font)] [font-size:var(--hb-font-size)]"
				data-bg={bg}
				data-theme={theme}
			>
				<MessageList
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					messages={messages}
					showBadges={showBadges}
					showTimestamps={showTimestamps}
					theme={theme}
				/>
			</div>
		</div>
	);
}
