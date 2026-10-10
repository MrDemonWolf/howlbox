import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const siteBase = (
	process.env.BASE_PATH ??
	process.env.SITE_BASE ??
	"/"
).replace(/^\/+|\/+$/g, "");
const siteBasePath = siteBase ? `/${siteBase}` : "";
const docsPath = `${siteBasePath}/docs`;
const siteOrigin = (
	process.env.SITE_ORIGIN ??
	(process.env.NODE_ENV === "development"
		? `http://localhost:${process.env.WEB_PORT ?? process.env.PORT ?? "3001"}`
		: "https://howlbox.mrdemonwolf.dev")
).replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const config = {
	output: "export",
	trailingSlash: true,
	basePath: docsPath,
	assetPrefix: `${docsPath}/`,
	env: {
		NEXT_PUBLIC_DOCS_PATH: docsPath,
		NEXT_PUBLIC_SITE_BASE: siteBasePath,
		NEXT_PUBLIC_SITE_URL: `${siteOrigin}${siteBasePath}`,
	},
};

export default withMDX(config);
