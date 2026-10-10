import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

import { SITE_URL } from "@/lib/site";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="inline-flex items-center gap-2.5">
					<Image
						src={`${SITE_URL}/favicon.svg`}
						alt=""
						aria-hidden="true"
						width={28}
						height={28}
						unoptimized
						className="size-7"
					/>
					<span className="font-semibold tracking-tight">HowlBox</span>
				</span>
			),
			url: "/",
			transparentMode: "top",
		},
		githubUrl: "https://github.com/MrDemonWolf/howlbox",
		links: [
			{
				text: "Configurator",
				url: `${SITE_URL}/config/`,
			},
		],
		searchToggle: { enabled: true },
		themeSwitch: { enabled: true, mode: "light-dark-system" },
	};
}
