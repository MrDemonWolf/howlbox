import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/legal-page";

const GITHUB_URL = "https://github.com/mrdemonwolf/howlbox";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
	head: () => ({
		meta: [
			{ title: "Terms of Service - HowlBox" },
			{
				name: "description",
				content:
					"The terms for using HowlBox, a self-hosted, client-only Twitch chat overlay for OBS.",
			},
		],
	}),
});

function ext(href: string, label: string) {
	return (
		<a href={href} rel="noreferrer" target="_blank">
			{label}
		</a>
	);
}

function TermsPage() {
	return (
		<LegalPage lastUpdated="July 17, 2026" title="Terms of Service">
			<section>
				<p>
					These terms govern your use of HowlBox, a self-hosted, client-only
					Twitch chat overlay for OBS browser sources published by MrDemonWolf,
					Inc. By using HowlBox, whether the hosted build or your own
					deployment, you agree to these terms. If you do not agree, do not use
					it.
				</p>
			</section>

			<section>
				<h2>License</h2>
				<p>
					HowlBox is open source. The source code is provided under the license
					in the project repository; see the{" "}
					{ext(`${GITHUB_URL}/blob/main/LICENSE`, "MIT License")}. You may host,
					modify, and redistribute it under those terms. These Terms of Service
					cover your use of the software and the hosted build, and do not narrow
					the rights the license grants.
				</p>
			</section>

			<section>
				<h2>Provided as is</h2>
				<p>
					HowlBox is provided "as is" and "as available", without warranties of
					any kind, express or implied, including merchantability, fitness for a
					particular purpose, and non-infringement. We do not guarantee that it
					will be uninterrupted, error free, or that any third-party service it
					depends on will remain available.
				</p>
				<p>
					To the maximum extent permitted by law, MrDemonWolf, Inc. is not
					liable for any damages arising from your use of, or inability to use,
					HowlBox.
				</p>
			</section>

			<section>
				<h2>Acceptable use</h2>
				<p>
					You are responsible for how you use HowlBox and what it displays. You
					agree to:
				</p>
				<ul>
					<li>
						Comply with the{" "}
						{ext(
							"https://www.twitch.tv/p/legal/terms-of-service/",
							"Twitch Terms of Service",
						)}{" "}
						and the terms of every third-party service HowlBox connects to.
					</li>
					<li>
						Not use HowlBox to harass, defame, or infringe the rights of others,
						or to display unlawful content.
					</li>
					<li>
						Accept responsibility for the chat and content shown on your stream
						through the overlay.
					</li>
				</ul>
			</section>

			<section>
				<h2>Third-party services and trademarks</h2>
				<p>
					HowlBox is not affiliated with, endorsed by, or sponsored by Twitch,
					7TV, BetterTTV, FrankerFaceZ, pronouns.alejo.io, or any other service
					it connects to. Twitch and all other names, logos, and trademarks are
					the property of their respective owners. Your use of those services is
					subject to their own terms, as described in our{" "}
					<Link to="/privacy">Privacy Policy</Link>.
				</p>
			</section>

			<section>
				<h2>Changes to these terms</h2>
				<p>
					We may update these terms as HowlBox changes. The date at the top
					reflects the latest revision. Continued use after an update means you
					accept the revised terms.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					Questions about these terms? Reach us via{" "}
					{ext("https://mrdwolf.net/discord", "Discord")} or{" "}
					{ext("https://www.mrdemonwolf.com", "mrdemonwolf.com")}.
				</p>
			</section>
		</LegalPage>
	);
}
