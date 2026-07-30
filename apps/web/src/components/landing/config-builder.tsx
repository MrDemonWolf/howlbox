import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { isValidLogin, type Theme } from "@/lib/overlay/params";
import { BG_LABEL, THEME_LABEL } from "@/lib/overlay/theme-meta";
import { buildOverlayUrl, parseOverlayUrl } from "@/lib/overlay/url";
import { type ChatEventKind, EVENT_KINDS } from "@/lib/twitch/types";

import {
	type Config,
	configToOverlay,
	DEFAULTS,
	parsedToConfig,
} from "./config-builder/form-model";
import { ConfigOutput } from "./config-builder/output";
import { ConfigSections } from "./config-builder/sections";

export function ConfigBuilder({ initialTheme }: { initialTheme?: Theme }) {
	const [config, setConfig] = useState<Config>(() =>
		initialTheme ? { ...DEFAULTS, theme: initialTheme } : DEFAULTS,
	);
	const [importDraft, setImportDraft] = useState("");

	const set = <K extends keyof Config>(key: K, value: Config[K]) =>
		setConfig((prev) => ({ ...prev, [key]: value }));

	// What the preview is currently showing, announced only once the user
	// stops adjusting. Screen readers get told the overlay changed without
	// being read a new line for every step of a slider drag.
	const summary = `${BG_LABEL[config.bg]} / ${THEME_LABEL[config.theme]} / ${config.size}%`;
	const [settled, setSettled] = useState(summary);
	useEffect(() => {
		const timer = setTimeout(() => setSettled(summary), 500);
		return () => clearTimeout(timer);
	}, [summary]);

	// Derived from the PREVIOUS state rather than the render closure, so
	// two quick clicks cannot both compute from the same stale list and
	// lose one of the toggles.
	const toggleEvent = (kind: ChatEventKind, on: boolean) =>
		setConfig((prev) => ({
			...prev,
			// kept in EVENT_KINDS order so the URL is stable no matter
			// which order the boxes were ticked
			events: on
				? EVENT_KINDS.filter((k) => k === kind || prev.events.includes(k))
				: prev.events.filter((k) => k !== kind),
		}));

	const cleanChannel = config.channel.trim().toLowerCase().replace(/^@/, "");
	// Buttons unlock only on a real Twitch login, not just any non-empty
	// text; a garbage channel would otherwise build a URL that never joins.
	const channelReady = isValidLogin(cleanChannel);
	// Show the inline error only once the user has typed something wrong,
	// never on the empty starting state.
	const channelInvalid = cleanChannel.length > 0 && !channelReady;

	const url = useMemo(
		() => buildOverlayUrl(configToOverlay(config, cleanChannel)),
		[cleanChannel, config],
	);

	// destructive: one click wipes every field. Snapshot first and hand
	// the old config back through an Undo action on the toast.
	const reset = () => {
		const previous = config;
		setConfig(DEFAULTS);
		setImportDraft("");
		toast.success("Reset to defaults", {
			action: { label: "Undo", onClick: () => setConfig(previous) },
		});
	};

	// Load an existing overlay link back into the form. Anything the
	// schema rejects lands on its default, exactly as the overlay would
	// have rendered it, so a stale or hand-edited link still imports.
	const importUrl = (raw = importDraft) => {
		const parsed = parseOverlayUrl(raw);
		if (!parsed) {
			toast.error("That does not look like an overlay URL");
			return;
		}
		setConfig(parsedToConfig(parsed));
		setImportDraft("");
		toast.success("Loaded, every control now matches that link");
	};

	// Pasting a real overlay URL is unambiguous, so skip the Load click.
	// Anything that does not parse falls through to a normal paste, which
	// keeps the button meaningful for hand-typed or edited links.
	const importOnPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = event.clipboardData.getData("text").trim();
		if (!parseOverlayUrl(pasted)) {
			return;
		}
		event.preventDefault();
		importUrl(pasted);
	};

	return (
		<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			<ConfigOutput
				channelInvalid={channelInvalid}
				channelReady={channelReady}
				config={config}
				onReset={reset}
				settled={settled}
				url={url}
			/>
			<ConfigSections
				channelInvalid={channelInvalid}
				config={config}
				importDraft={importDraft}
				onImport={() => importUrl()}
				onImportPaste={importOnPaste}
				set={set}
				setImportDraft={setImportDraft}
				toggleEvent={toggleEvent}
			/>
		</div>
	);
}
