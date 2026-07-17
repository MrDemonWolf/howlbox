import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/legal-page";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
	head: () => ({
		meta: [
			{ title: "Privacy Policy - HowlBox" },
			{
				name: "description",
				content:
					"How HowlBox handles data: it does not. A client-only overlay with no accounts, no servers, and no tracking.",
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

function PrivacyPage() {
	return (
		<LegalPage lastUpdated="July 17, 2026" title="Privacy Policy">
			<section>
				<p>
					HowlBox is a self-hosted, client-only Twitch chat overlay for OBS
					browser sources, published by MrDemonWolf, Inc. It runs entirely in
					your browser. There is no HowlBox account, no HowlBox server, and no
					analytics or tracking. This page explains what that means for your
					data.
				</p>
			</section>

			<section>
				<h2>What we collect</h2>
				<p>
					Nothing. MrDemonWolf, Inc. does not operate any server that receives,
					stores, or processes your data through HowlBox. We cannot see your
					overlay, your channel, or your chat.
				</p>
			</section>

			<section>
				<h2>Your configuration</h2>
				<p>
					Every overlay setting is encoded in the overlay URL you build and
					paste into OBS. That URL lives in your OBS scene collection on your
					own computer. It is never transmitted to us.
				</p>
			</section>

			<section>
				<h2>Local storage on your device</h2>
				<p>
					To avoid re-downloading the same assets on every OBS reload, HowlBox
					caches emote, badge, and pronoun data in your browser's localStorage.
					This data stays on your device, is never sent to us, and is cleared
					when you clear your browser or OBS browser-source cache. HowlBox sets
					no cookies.
				</p>
			</section>

			<section>
				<h2>Third-party services</h2>
				<p>
					To render chat, your browser connects directly to third-party
					services. These connections are made by your browser, not routed
					through MrDemonWolf, and each service is governed by its own privacy
					policy:
				</p>
				<ul>
					<li>
						{ext("https://www.twitch.tv/p/legal/privacy-notice/", "Twitch")} -
						anonymous, read-only IRC to receive public chat messages.
					</li>
					<li>
						{ext("https://7tv.app/legal/privacy", "7TV")},{" "}
						{ext("https://betterttv.com/", "BetterTTV")}, and{" "}
						{ext("https://www.frankerfacez.com/", "FrankerFaceZ")} - emote
						images and metadata.
					</li>
					<li>{ext("https://ivr.fi/", "api.ivr.fi")} - Twitch badge art.</li>
					<li>
						{ext("https://pronouns.alejo.io/", "pronouns.alejo.io")} - pronoun
						badges. Contacted only when the <code>pronouns</code> option is
						enabled, and only to look up the pronoun a chatter has set there.
					</li>
				</ul>
				<p>
					MrDemonWolf, Inc. does not control these services and is not
					responsible for their practices. Review their policies to understand
					how they handle requests from your browser.
				</p>
			</section>

			<section>
				<h2>Chat messages</h2>
				<p>
					HowlBox displays public Twitch chat messages in real time so they can
					be shown on stream. Messages are rendered transiently in your browser
					and are not collected, stored, or sold by us. Deleted or moderated
					messages are removed from the overlay.
				</p>
			</section>

			<section>
				<h2>Your rights</h2>
				<p>
					Because we do not collect or store personal data, there is nothing on
					our side to access, correct, or delete. Data shown in the overlay
					originates from Twitch and the third-party services above; direct any
					such requests to those providers. Regulations like the GDPR and CCPA
					concern data a business collects; HowlBox collects none.
				</p>
			</section>

			<section>
				<h2>Changes to this policy</h2>
				<p>
					We may update this policy as HowlBox changes. The date at the top
					reflects the latest revision. Continued use after an update means you
					accept the revised policy.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					Questions about this policy? Reach us via{" "}
					{ext("https://mrdwolf.net/discord", "Discord")} or{" "}
					{ext("https://www.mrdemonwolf.com", "mrdemonwolf.com")}. See also our{" "}
					<Link to="/terms">Terms of Service</Link>.
				</p>
			</section>
		</LegalPage>
	);
}
