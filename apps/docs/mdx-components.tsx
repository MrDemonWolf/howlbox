import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

import { SITE_BASE, SITE_URL } from "@/lib/site";

function MdxLink({
	href = "",
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
	if (href === "/docs" || href.startsWith("/docs/")) {
		return <Link href={href.slice("/docs".length) || "/"} {...props} />;
	}
	if (href.startsWith("/") && !href.startsWith("//")) {
		const sitePath =
			process.env.NODE_ENV === "development" ? SITE_URL : SITE_BASE;
		return <a href={`${sitePath}${href}`} {...props} />;
	}
	return <a href={href} {...props} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		Callout,
		Card,
		Cards,
		a: MdxLink,
		...components,
	};
}
