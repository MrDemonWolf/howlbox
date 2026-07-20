import { cn } from "@howlbox/ui/lib/utils";

import { HbRoot } from "@/components/chat/hb-root";
import { MessageList } from "@/components/chat/message-list";
import { useDemoStream } from "@/components/landing/demo-messages";
import type { BgMode, Theme } from "@/lib/overlay/params";

import "@/components/chat/overlay.css";

interface OverlayPreviewProps {
	theme: Theme;
	bg: BgMode;
	showBadges: boolean;
	showPronouns?: boolean;
	showTimestamps: boolean;
	animate: boolean;
	fadeSeconds: number;
	size?: number;
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
	showPronouns = false,
	showTimestamps,
	animate,
	fadeSeconds,
	size = 100,
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
			<HbRoot bg={bg} className="absolute inset-0" size={size} theme={theme}>
				<MessageList
					animate={animate}
					bg={bg}
					fadeSeconds={fadeSeconds}
					messages={messages}
					showBadges={showBadges}
					showPronouns={showPronouns}
					showTimestamps={showTimestamps}
					theme={theme}
				/>
			</HbRoot>
		</div>
	);
}
