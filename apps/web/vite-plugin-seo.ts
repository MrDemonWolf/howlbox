import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite";

import {
	canonicalFor,
	OG_IMAGE_ALT,
	SEO_ROUTES,
	SITE_URL,
	STRUCTURED_DATA,
} from "./src/lib/seo/routes";

const BEGIN = "<!-- SEO:BEGIN -->";
const END = "<!-- SEO:END -->";

const escapeHtml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function headFor(route: (typeof SEO_ROUTES)[number]) {
	const url = canonicalFor(route.path);
	const image = `${SITE_URL}${route.ogImage}`;
	const title = escapeHtml(route.title);
	const description = escapeHtml(route.description);

	// A noindexed page gets no canonical: pointing at itself while asking
	// not to be indexed is a mixed signal, and pointing elsewhere is a lie.
	const canonical = route.index
		? `<link rel="canonical" href="${url}" />`
		: '<meta name="robots" content="noindex, nofollow" />';

	return [
		`<title>${title}</title>`,
		`<meta name="description" content="${description}" />`,
		canonical,
		`<meta property="og:url" content="${url}" />`,
		`<meta property="og:title" content="${title}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta property="og:image" content="${image}" />`,
		`<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
		`<meta name="twitter:title" content="${title}" />`,
		`<meta name="twitter:description" content="${description}" />`,
		`<meta name="twitter:image" content="${image}" />`,
		// Structured data only on indexable pages; the home page carries the
		// product description for everyone.
		route.index && route.path === ""
			? `<script type="application/ld+json">${JSON.stringify(STRUCTURED_DATA)}</script>`
			: "",
	]
		.filter(Boolean)
		.map((line) => `    ${line}`)
		.join("\n");
}

function swapHead(html: string, route: (typeof SEO_ROUTES)[number]) {
	const start = html.indexOf(BEGIN);
	const end = html.indexOf(END);
	if (start === -1 || end === -1) {
		throw new Error(
			"index.html is missing the SEO:BEGIN / SEO:END markers, so per-route head rewriting cannot run",
		);
	}
	return (
		html.slice(0, start + BEGIN.length) +
		"\n" +
		headFor(route) +
		"\n    " +
		html.slice(end)
	);
}

/**
 * Emits one real index.html per route, plus robots.txt and sitemap.xml.
 *
 * Without this, GitHub Pages answers every route except "/" from
 * 404.html with an HTTP 404 status. Google will not index a 404 no
 * matter what the body renders, and several unfurlers skip non-2xx
 * responses outright, so /docs and /config were invisible and every
 * route shipped the home page's title and canonical.
 */
export function seoPlugin(): Plugin {
	return {
		name: "howlbox-seo",
		apply: "build",
		async closeBundle() {
			const dist = join(import.meta.dirname, "dist");
			const template = await readFile(join(dist, "index.html"), "utf8");

			for (const route of SEO_ROUTES) {
				const html = swapHead(template, route);
				if (route.path === "") {
					await writeFile(join(dist, "index.html"), html);
					continue;
				}
				await mkdir(join(dist, route.path), { recursive: true });
				await writeFile(join(dist, route.path, "index.html"), html);
			}

			// Unknown paths still need a fallback, and it must not be indexed
			// or Google sees a soft 404 for every typo.
			const notFound = swapHead(template, {
				path: "404",
				title: "Page not found - HowlBox",
				description: "That page does not exist.",
				ogImage: "og.png",
				index: false,
			});
			await writeFile(join(dist, "404.html"), notFound);

			// robots.txt is only read from the host root, so on a project
			// subpath this file is inert. Shipping it anyway costs nothing and
			// becomes correct the day this moves to a custom domain. The
			// noindex meta above is what actually keeps /overlay out.
			await writeFile(
				join(dist, "robots.txt"),
				`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
			);

			const urls = SEO_ROUTES.filter((route) => route.index)
				.map((route) => `  <url><loc>${canonicalFor(route.path)}</loc></url>`)
				.join("\n");
			await writeFile(
				join(dist, "sitemap.xml"),
				`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
			);
		},
	};
}
