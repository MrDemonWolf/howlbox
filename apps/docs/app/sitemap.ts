import type { MetadataRoute } from "next";

import { DOCS_PATH, SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
	return source.getPages().map((page) => ({
		url: new URL(
			page.url === "/"
				? `${DOCS_PATH}/`
				: `${DOCS_PATH}${page.url.replace(/\/$/, "")}/`,
			SITE_URL,
		).toString(),
	}));
}
