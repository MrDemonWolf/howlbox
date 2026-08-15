import { Component, type ReactNode } from "react";
import ReactDOM from "react-dom/client";

import { loadThemeCss } from "@/components/chat/themes/load";
import { OverlayErrorFallback } from "@/components/error-fallbacks";
import { parseOverlaySearch } from "@/lib/overlay/parse-search";

import { OverlayApp } from "./overlay-app";
import "./overlay-entry.css";

class OverlayBoundary extends Component<
	{ children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? <OverlayErrorFallback /> : this.props.children;
	}
}

const rootElement = document.getElementById("app");
if (!rootElement) {
	throw new Error("Root element not found");
}

const params = parseOverlaySearch(new URLSearchParams(window.location.search));

// Wait for the theme chunk before first paint so the source does not
// flash wolf. loadThemeCss never rejects and times out on its own, so a
// missing chunk still renders on the base variables instead of blanking.
if (!rootElement.innerHTML) {
	void loadThemeCss(params.theme).then(() => {
		ReactDOM.createRoot(rootElement).render(
			<OverlayBoundary>
				<OverlayApp params={params} />
			</OverlayBoundary>,
		);
	});
}
