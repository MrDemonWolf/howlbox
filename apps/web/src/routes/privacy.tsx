import { createFileRoute, Link } from "@tanstack/react-router";

import { ext, LegalPage } from "@/components/landing/legal-page";

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
					policy. The channel login you configure, and each chatter's login, are
					sent to these services as part of the requests below; no other data
					about you is added:
				</p>
				<ul>
					<li>
						{ext("https://www.twitch.tv/p/legal/privacy-notice/", "Twitch")} -
						anonymous, read-only IRC to receive the public chat for your
						configured channel.
					</li>
					<li>
						{ext("https://7tv.app/legal/privacy", "7TV")},{" "}
						{ext("https://betterttv.com/", "BetterTTV")}, and{" "}
						{ext("https://www.frankerfacez.com/", "FrankerFaceZ")} - emote
						images and metadata for your channel and globally. Your channel
						login is sent to look up its emote set.
					</li>
					<li>
						{ext("https://ivr.fi/", "api.ivr.fi")} - Twitch badge art, and, when
						profile pictures are enabled (<code>avatars</code>), the avatar for
						each chatter looked up by their login.
					</li>
					<li>
						{ext("https://pronouns.alejo.io/", "pronouns.alejo.io")} - pronoun
						badges. Contacted only when the <code>pronouns</code> option is
						enabled, and only to look up the pronoun a chatter set there, keyed
						by their login.
					</li>
					<li>
						{ext("https://docs.github.com/rest/gists", "GitHub")} - only when
						you point the <code>badgegist</code> option at a public gist of
						custom badge art. Your browser fetches that gist through GitHub's
						public API.
					</li>
					<li>
						Any image host you name in the <code>badgeart</code> or{" "}
						<code>badgegist</code> options. Custom badge art is an arbitrary
						HTTPS image URL you supply, so your browser requests it directly
						from whatever host you chose. Badge, emote, and avatar images are
						loaded with a no-referrer policy, so the overlay URL is not sent to
						those hosts.
					</li>
				</ul>
				<p>
					MrDemonWolf, Inc. does not control these services and is not
					responsible for their practices. Review their policies to understand
					how they handle requests from your browser. Options that are off send
					nothing: pronoun, avatar, and custom badge requests happen only when
					you enable them.
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
