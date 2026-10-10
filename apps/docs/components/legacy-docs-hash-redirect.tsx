"use client";

import { useEffect } from "react";

import { DOCS_PATH } from "@/lib/site";

const sectionPaths: Record<string, string> = {
	"quick-start": "getting-started",
	themes: "themes",
	"badge-art": "custom-badges",
	"custom-css": "custom-css",
	troubleshooting: "troubleshooting",
	limits: "limitations",
	channel: "url-reference",
	look: "url-reference",
	events: "url-reference",
	messages: "url-reference",
	moderation: "url-reference",
	advanced: "url-reference",
};

export function LegacyDocsHashRedirect() {
	useEffect(() => {
		if (
			(window.location.pathname !== `${DOCS_PATH}/` &&
				window.location.pathname !== DOCS_PATH) ||
			!window.location.hash
		) {
			return;
		}

		const hash = decodeURIComponent(window.location.hash.slice(1));
		const page = hash.startsWith("param-")
			? "url-reference"
			: sectionPaths[hash];
		if (page) {
			window.location.replace(`${DOCS_PATH}/${page}/#${hash}`);
		}
	}, []);

	return null;
}
