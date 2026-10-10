"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

import { LegacyDocsHashRedirect } from "@/components/legacy-docs-hash-redirect";
import Search from "@/components/search";

export function Provider({ children }: { children: ReactNode }) {
	return (
		<RootProvider search={{ SearchDialog: Search }}>
			<LegacyDocsHashRedirect />
			{children}
		</RootProvider>
	);
}
