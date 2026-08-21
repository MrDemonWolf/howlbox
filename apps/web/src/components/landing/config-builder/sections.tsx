// The configurator's right column: the grouped control sections (Import,
// Channel, Look, Messages, Events, Moderation, Advanced). Pure view over
// the Config plus the setters the parent owns.

import { Input } from "@howlbox/ui/components/input";
import { Label } from "@howlbox/ui/components/label";
import { cn } from "@howlbox/ui/lib/utils";
import { ChevronDown, ClipboardPaste } from "lucide-react";
import type React from "react";

import {
	ALIGNS,
	BG_MODES,
	LAYOUTS,
	MEDIA_MODES,
	SCROLL_MODES,
	THEME_VARIANTS,
	THEMES,
} from "@/lib/overlay/params";
import {
	BG_LABEL,
	FAMILY_LABEL,
	FAMILY_ORDER,
	THEME_FAMILY,
	THEME_LABEL,
	THEME_SWATCH,
	VARIANT_LABEL,
	VARIANT_SWATCH,
} from "@/lib/overlay/theme-meta";
import { type ChatEventKind, EVENT_KINDS } from "@/lib/twitch/types";

import { Field, Fieldset, NumberField, Toggle } from "./fields";
import {
	AVATAR_OPTIONS,
	type Config,
	EMOTE_SCALE_PRESETS,
	EVENT_TOGGLES,
	FIELD,
	REFRESH_PRESETS,
	SCROLL_SPEED_PRESETS,
	type SetConfig,
	SIZE_PRESETS,
} from "./form-model";

export function ConfigSections({
	config,
	set,
	toggleEvent,
	channelInvalid,
	importDraft,
	setImportDraft,
	onImport,
	onImportPaste,
}: {
	config: Config;
	set: SetConfig;
	toggleEvent: (kind: ChatEventKind, on: boolean) => void;
	channelInvalid: boolean;
	importDraft: string;
	setImportDraft: (value: string) => void;
	onImport: () => void;
	onImportPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="order-1 flex flex-col gap-4 lg:order-2">
			{/* import: the fastest path for anyone who already has an overlay */}
			<Fieldset
				hint="Already have an overlay in OBS? Paste that URL here and every setting loads on its own."
				hintId="import-hint"
				title="Start from an existing link"
			>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						aria-describedby="import-hint"
						aria-label="Existing overlay URL"
						autoComplete="off"
						className={cn(FIELD, "flex-1")}
						onChange={(e) => setImportDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								onImport();
							}
						}}
						onPaste={onImportPaste}
						placeholder="https://.../overlay?channel=you&theme=neon"
						value={importDraft}
					/>
					<button
						className="hb-btn hb-btn-secondary"
						disabled={!importDraft.trim()}
						onClick={onImport}
						type="button"
					>
						<ClipboardPaste aria-hidden="true" className="size-4" /> Load
					</button>
				</div>
			</Fieldset>

			<Fieldset title="Channel">
				{/* Not wired through Field's hint (its describe helper would
				    overwrite aria-describedby); the input points at both the
				    hint and, when invalid, the error itself. */}
				<div className="grid gap-2">
					<Label htmlFor="cfg-channel">
						Twitch channel{" "}
						<span className="font-normal text-[color:var(--site-txt-2)] text-xs">
							(required)
						</span>
					</Label>
					<Input
						aria-describedby={cn(
							"cfg-channel-hint",
							channelInvalid && "cfg-channel-error",
						)}
						aria-invalid={channelInvalid}
						autoComplete="off"
						className={FIELD}
						id="cfg-channel"
						onChange={(e) => set("channel", e.target.value)}
						placeholder="your_channel"
						required
						value={config.channel}
					/>
					<p
						className="text-[color:var(--site-txt-2)] text-xs leading-relaxed"
						id="cfg-channel-hint"
					>
						Just the login name, no URL or @.
					</p>
					{channelInvalid && (
						<p
							className="text-[color:var(--site-danger,#e5484d)] text-xs"
							id="cfg-channel-error"
						>
							Not a valid Twitch channel name. Use 1 to 25 letters, numbers or
							underscores, no spaces.
						</p>
					)}
				</div>
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
					<div className="flex flex-col gap-3">
						{FAMILY_ORDER.map((family) => (
							<div key={family}>
								<p className="mb-1.5 font-medium text-[0.65rem] text-[color:var(--site-txt-2)] uppercase tracking-[0.12em]">
									{FAMILY_LABEL[family]}
								</p>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{THEMES.filter((t) => THEME_FAMILY[t] === family).map((t) => (
										<button
											aria-pressed={t === config.theme}
											className={cn(
												"flex min-h-11 items-center gap-2 rounded-[0.7rem] border px-3 text-left text-sm transition-colors",
												t === config.theme
													? "border-[color:var(--site-brand)] bg-[color:var(--site-brand-tint)] text-[color:var(--site-txt-1)]"
													: "hb-hairline-strong text-[color:var(--site-txt-2)] hover:border-[color:var(--site-brand)] hover:text-[color:var(--site-txt-1)]",
											)}
											key={t}
											onClick={() => {
												set("theme", t);
												// a variant belongs to one theme; switching to a
												// theme that does not declare it resets to default
												const variants: readonly string[] = THEME_VARIANTS[t];
												if (!variants.includes(config.variant)) {
													set("variant", "");
												}
											}}
											type="button"
										>
											<span
												aria-hidden="true"
												className="hb-hairline size-4 shrink-0 rounded-full border"
												style={{ background: THEME_SWATCH[t] }}
											/>
											<span className="truncate">{THEME_LABEL[t]}</span>
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</Field>

				{THEME_VARIANTS[config.theme].length > 0 && (
					<Field
						hint="Same layout and fonts, different palette."
						label="Variant"
					>
						<div className="flex flex-wrap gap-2">
							<button
								aria-pressed={config.variant === ""}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.variant === "" && "hb-btn-selected",
								)}
								onClick={() => set("variant", "")}
								type="button"
							>
								Default
							</button>
							{(THEME_VARIANTS[config.theme] as readonly string[]).map((v) => (
								<button
									aria-pressed={config.variant === v}
									className={cn(
										"hb-btn hb-btn-sm hb-btn-secondary flex items-center gap-1.5",
										config.variant === v && "hb-btn-selected",
									)}
									key={v}
									onClick={() => set("variant", v)}
									type="button"
								>
									<span
										aria-hidden="true"
										className="hb-hairline size-3 shrink-0 rounded-full border"
										style={{
											background: (
												VARIANT_SWATCH[config.theme] as Record<string, string>
											)[v],
										}}
									/>
									{(VARIANT_LABEL[config.theme] as Record<string, string>)[v]}
								</button>
							))}
						</div>
					</Field>
				)}

				<Field
					hint="On top puts badges and name on their own line above the message."
					label="Name position"
				>
					<div className="flex flex-wrap gap-2">
						{LAYOUTS.map((mode) => (
							<button
								aria-pressed={config.layout === mode}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.layout === mode && "hb-btn-selected",
								)}
								key={mode}
								onClick={() => set("layout", mode)}
								type="button"
							>
								{mode === "inline" ? "Inline" : "On top"}
							</button>
						))}
					</div>
				</Field>

				{/* Same ?align param, two jobs: an edge to hug when messages
				    stack, a direction of travel in a ticker lane. Label the
				    one in force rather than making the reader hold both. */}
				<Field
					hint={
						config.scroll === "ticker"
							? "Which way the lane travels. Right to left is the usual ticker direction; left to right runs the same lane the way you read."
							: "Right hugs messages to the right edge, for chat parked on that side of the scene."
					}
					label={config.scroll === "ticker" ? "Direction" : "Alignment"}
				>
					<div className="flex flex-wrap gap-2">
						{ALIGNS.map((side) => (
							<button
								aria-pressed={config.align === side}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.align === side && "hb-btn-selected",
								)}
								key={side}
								onClick={() => set("align", side)}
								type="button"
							>
								{config.scroll === "ticker"
									? side === "left"
										? "Left to right"
										: "Right to left"
									: side === "left"
										? "Left"
										: "Right"}
							</button>
						))}
					</div>
				</Field>

				<Field
					hint="Ticker lays chat out as one horizontal lane, for a strip under the gameplay. A lane fits roughly one message every few seconds, so on a busy channel it shows a sample of recent chat rather than all of it."
					label="Motion"
				>
					<div className="flex flex-wrap gap-2">
						{SCROLL_MODES.map((mode) => (
							<button
								aria-pressed={config.scroll === mode}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.scroll === mode && "hb-btn-selected",
								)}
								key={mode}
								onClick={() => set("scroll", mode)}
								type="button"
							>
								{mode === "off" ? "Stacked" : "Ticker"}
							</button>
						))}
					</div>
				</Field>

				{config.scroll === "ticker" && (
					<Field
						hint="How fast the lane moves. 1x crosses a 1920px source in about 16 seconds; 5x does it in three. Faster also means more messages get through."
						label={`Ticker speed (${config.scrollspeed}x)`}
					>
						<div className="flex flex-wrap gap-2">
							{SCROLL_SPEED_PRESETS.map((value) => (
								<button
									aria-pressed={config.scrollspeed === value}
									className={cn(
										"hb-btn hb-btn-sm hb-btn-secondary min-w-11",
										config.scrollspeed === value && "hb-btn-selected",
									)}
									key={value}
									onClick={() => set("scrollspeed", value)}
									type="button"
								>
									{value}x
								</button>
							))}
						</div>
					</Field>
				)}

				{/* named stops only; the form has no free slider, so these
				    cover the whole 50-300 range the schema accepts */}
				<Field
					hint="Scales the theme's own text size, so a theme that ships smaller type stays proportionally smaller."
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
				</Field>

				{/* emote multiplier: same stop-button shape as text size right
				    above, so the two size knobs read as a pair */}
				<Field
					hint="Only messages that are nothing but emotes grow. One word alongside the emote and the message stays at normal size. Cheermote art follows the same multiplier."
					label={`Emote size (${config.emotescale}x)`}
				>
					<div className="flex flex-wrap gap-2">
						{EMOTE_SCALE_PRESETS.map((preset) => (
							<button
								aria-pressed={config.emotescale === preset.value}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary min-w-11",
									config.emotescale === preset.value && "hb-btn-selected",
								)}
								key={preset.label}
								onClick={() => set("emotescale", preset.value)}
								type="button"
							>
								{preset.label}
							</button>
						))}
					</div>
				</Field>

				<Field
					hint="Profile pictures are looked up per user from api.ivr.fi. Subscribers only keeps that lookup to people invested in your channel instead of every passer-by."
					label="Profile pictures"
				>
					<div className="flex flex-wrap gap-2">
						{AVATAR_OPTIONS.map((option) => (
							<button
								aria-pressed={config.avatars === option.value}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.avatars === option.value && "hb-btn-selected",
								)}
								key={option.value}
								onClick={() => set("avatars", option.value)}
								type="button"
							>
								{option.label}
							</button>
						))}
					</div>
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
								className="underline hover:text-[color:var(--site-txt-1)]"
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
				<Field
					hint="Static freezes animated emotes and cheer art to reduce continuous OBS decoding."
					label="Emote and cheer motion"
				>
					<div className="flex flex-wrap gap-2">
						{MEDIA_MODES.map((mode) => (
							<button
								aria-pressed={config.media === mode}
								className={cn(
									"hb-btn hb-btn-sm hb-btn-secondary",
									config.media === mode && "hb-btn-selected",
								)}
								key={mode}
								onClick={() => set("media", mode)}
								type="button"
							>
								{mode === "animated" ? "Animated" : "Static"}
							</button>
						))}
					</div>
				</Field>
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
				<Toggle
					checked={config.group}
					hint="Consecutive messages from one chatter show the name once."
					id="cfg-group"
					label="Group repeat chatters"
					onChange={(v) => set("group", v)}
				/>
			</Fieldset>

			<Fieldset title="Events">
				<p className="text-[color:var(--site-txt-2)] text-sm leading-relaxed">
					Subs, gifts, raids and cheers all arrive on the same anonymous
					connection the chat does, so these need no account. Each one shows as
					a row in the chat column.
				</p>
				{/* most people want either the lot or none of it, so make
				    that one click instead of five */}
				<div className="flex flex-wrap gap-2">
					<button
						aria-pressed={config.events.length === EVENT_KINDS.length}
						className={cn(
							"hb-btn hb-btn-sm hb-btn-secondary",
							config.events.length === EVENT_KINDS.length && "hb-btn-selected",
						)}
						onClick={() => set("events", [...EVENT_KINDS])}
						type="button"
					>
						All events
					</button>
					<button
						aria-pressed={config.events.length === 0}
						className={cn(
							"hb-btn hb-btn-sm hb-btn-secondary",
							config.events.length === 0 && "hb-btn-selected",
						)}
						onClick={() => set("events", [])}
						type="button"
					>
						None
					</button>
				</div>
				{EVENT_TOGGLES.map((toggle) => (
					<Toggle
						checked={config.events.includes(toggle.kind)}
						hint={toggle.hint}
						id={`cfg-event-${toggle.kind}`}
						key={toggle.kind}
						label={toggle.label}
						onChange={(on) => toggleEvent(toggle.kind, on)}
					/>
				))}
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

			{/* the long tail, folded away: most streamers never open this.
			    Two unrelated jobs live here (swapping badge art, and how
			    often emotes refetch), so each gets its own labeled row. */}
			<details className="hb-card group">
				<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5">
					<span className="flex flex-col gap-0.5">
						<h2 className="font-semibold text-[color:var(--site-txt-1)] text-base">
							Advanced
						</h2>
						<span className="text-[color:var(--site-txt-2)] text-xs">
							Custom badge art and how often emotes refresh
						</span>
					</span>
					<ChevronDown
						aria-hidden="true"
						className="size-4 shrink-0 text-[color:var(--site-txt-2)] transition-transform group-open:rotate-180"
					/>
				</summary>
				<div className="flex flex-col gap-5 px-5 pt-1 pb-5">
					<div className="flex flex-col gap-4">
						<p className="text-[color:var(--site-txt-2)] text-xs leading-relaxed">
							Every global and channel badge already loads on its own. Use these
							only to swap in your own art, keyed by badge{" "}
							<code className="text-[color:var(--site-txt-1)]">set</code> (and
							optional{" "}
							<code className="text-[color:var(--site-txt-1)]">/version</code>).
						</p>
						<Field
							hint="One or more set=url pairs, comma separated, like moderator=https://example.com/mod.png. Add /version after the set to target one tier."
							htmlFor="cfg-badgeart"
							label="Replace badge art"
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
							hint="Same set=url pairs (one per line) or a JSON map, in a public gist. Edit the gist to change badges without touching this URL."
							htmlFor="cfg-badgegist"
							label="...or point at a GitHub gist"
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
					</div>

					<div className="hb-hairline border-t pt-4">
						<Field
							hint="Pulls new 7TV, BTTV, FFZ, and badge art mid-stream so fresh emotes show up without reloading OBS. A gentle interval keeps the smaller emote APIs happy."
							label={`Refresh emotes (${config.refresh === 0 ? "off" : `every ${config.refresh} min`})`}
						>
							{/* The top stop matches the schema's 1440-minute max, so an
							    imported refresh never has to be misrepresented. An
							    imported value that is not a stop still shows in the
							    label above and survives untouched. */}
							<div className="flex flex-wrap gap-2">
								{REFRESH_PRESETS.map((preset) => (
									<button
										aria-pressed={config.refresh === preset.value}
										className={cn(
											"hb-btn hb-btn-sm hb-btn-secondary",
											config.refresh === preset.value && "hb-btn-selected",
										)}
										key={preset.label}
										onClick={() => set("refresh", preset.value)}
										type="button"
									>
										{preset.label}
									</button>
								))}
							</div>
						</Field>
					</div>
				</div>
			</details>
		</div>
	);
}
