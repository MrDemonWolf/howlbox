import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DOCS_PATH, SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: PageProps<"/[[...slug]]">) {
	const { slug } = await props.params;
	const page = source.getPage(slug);
	if (!page) notFound();

	const MDX = page.data.body;
	return (
		<DocsPage toc={page.data.toc}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX components={getMDXComponents()} />
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(
	props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
	const { slug } = await props.params;
	const page = source.getPage(slug);
	if (!page) return {};

	const pagePath =
		page.url === "/"
			? `${DOCS_PATH}/`
			: `${DOCS_PATH}${page.url.replace(/\/$/, "")}/`;
	const canonical = new URL(pagePath, SITE_URL).toString();
	return {
		title: page.data.title,
		description: page.data.description,
		keywords: page.data.keywords,
		alternates: { canonical },
		openGraph: {
			type: "article",
			siteName: "HowlBox",
			url: canonical,
			title: page.data.title,
			description: page.data.description,
		},
		twitter: {
			card: "summary_large_image",
			title: page.data.title,
			description: page.data.description,
		},
	};
}
