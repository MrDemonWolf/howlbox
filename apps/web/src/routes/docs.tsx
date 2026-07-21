import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BackLink, MONO, SiteShell } from "@/components/landing/site-chrome";
import { pickActiveSection } from "@/lib/docs/active-section";
import { THEMES } from "@/lib/overlay/params";
import { THEME_LABEL } from "@/lib/overlay/theme-meta";

export const Route = createFileRoute("/docs")({
	component: DocsPage,
	head: () => ({
		meta: [
			{ title: "Docs - HowlBox overlay URL parameters" },
			{
				name: "description",
				content:
					"Every HowlBox URL parameter, the custom badge art formats, the hb-* CSS classes for the OBS Custom CSS field, and what to check when an overlay stays blank.",
			},
		],
	}),
});

type Param = {
	name: string;
	values: string;
	body: React.ReactNode;
};

// Grouped the way the configurator groups them, so someone reading a
// URL and someone using the builder are looking at the same four boxes.
const GROUPS: { id: string; title: string; blurb: string; params: Param[] }[] =
	[
		{
			id: "channel",
			title: "Channel",
			blurb: "The only parameter the overlay cannot run without.",
			params: [
				{
					name: "channel",
					values: "a Twitch login name",
					body: "The channel to join. Login name only, not a URL and not a display name: mrdemonwolf, not MrDemonWolf or twitch.tv/mrdemonwolf. Anything that fails the Twitch login pattern is dropped, and the overlay shows a status pill instead of joining.",
				},
			],
		},
		{
			id: "look",
			title: "Look",
			blurb: "Theme, display mode, and text size.",
			params: [
				{
					name: "theme",
					values: THEMES.join(", "),
					body: "One of the fifteen presets. Each theme sets its own font, radius, surface, border, shadow, and text glow through CSS variables, so themes are swappable without touching layout. Default wolf.",
				},
				{
					name: "bg",
					values: "off, panel, bubble",
					body: "Display mode. off draws bare text over gameplay with an outline stack for legibility, panel puts one themed backdrop behind the whole column, bubble gives each message its own surface. The panel backdrop only draws while messages exist, so a quiet channel shows nothing rather than an empty rectangle. Default off.",
				},
				{
					name: "size",
					values: "50 to 300, percent",
					body: "Scales the theme's own font size. Change this rather than resizing the browser source with OBS transform handles, which resamples the render and blurs the text. Default 100.",
				},
				{
					name: "avatars",
					values: "off, all, subs",
					body: "Profile pictures before the name. Like pronouns this is a per-user third-party lookup, from api.ivr.fi, so it is off by default and the first message from a given chatter usually misses the picture. all fetches one for everybody; subs only fetches for subscribers and founders, which is the setting to use on a busy channel: it reads the subscriber tag already on the message, so drive-by chatters never trigger a lookup at all. The shape follows the theme, so a circle on wolf and a hard square on terminal or retro95. Default off.",
				},
			],
		},
		{
			id: "events",
			title: "Events",
			blurb:
				"Subs, gifts, raids and cheers, rendered as rows in the chat column.",
			params: [
				{
					name: "events",
					values: "comma-separated: sub, cheer, raid, first, announce, or all",
					body: "Which events to show. Anonymous IRC carries all of these, so none of it needs an account: sub covers new subs, resubs, single and mass gifts, and Prime upgrades; cheer shows bits with the matching tier art; raid shows the raider and their viewer count; first marks a chatter's first message in the channel, and returning chatters; announce marks the /announce highlight from mods. Unknown values are dropped, and all is shorthand for every kind. A sub or raid row is a whole sentence with no separate name header, while a cheer, first message or announcement decorates the message it came with. Default empty, meaning no events.",
				},
			],
		},
		{
			id: "messages",
			title: "Messages",
			blurb: "What each row shows and how long it stays.",
			params: [
				{
					name: "max",
					values: "1 to 200",
					body: "How many messages stay on screen. Older rows are dropped from the top. Default 50.",
				},
				{
					name: "fade",
					values: "0 to 600, seconds",
					body: "Auto-hide each message this many seconds after it appears. 0 keeps everything until max pushes it out. The countdown is a CSS animation, not a JS timer, because OBS throttles timers in hidden sources but keeps animation clocks running. Default 0.",
				},
				{
					name: "badges",
					values: "true, false",
					body: "Badge art before the name: global Twitch badges plus the channel's own subscriber and bits art. Default true.",
				},
				{
					name: "pronouns",
					values: "true, false",
					body: "A text pronoun badge before the name, from pronouns.alejo.io, the same service 7TV and FrankerFaceZ read. Off by default because it is a per-user lookup: the first message from a given chatter usually misses the badge and later ones hit it. Turn it on only if that third-party call is acceptable for your channel.",
				},
				{
					name: "timestamps",
					values: "true, false",
					body: "HH:MM before each message. Default false.",
				},
				{
					name: "animate",
					values: "true, false",
					body: "Entrance animation on new messages. Transform and opacity only, so it stays cheap on CPU-rendered OBS setups. Default true.",
				},
			],
		},
		{
			id: "moderation",
			title: "Moderation and filters",
			blurb: "Keeping things off screen.",
			params: [
				{
					name: "delay",
					values: "0 to 300, seconds",
					body: "Hold non-mod messages this long before rendering them, so a deletion or timeout lands first. Messages from mods and the broadcaster skip the buffer. The buffer is bounded, and deletes, timeouts, and bans evict anything still pending. Default 0.",
				},
				{
					name: "hidebots",
					values: "true, false",
					body: "Hide messages from a built-in list of common chat bots (Nightbot, StreamElements, Streamlabs, Moobot, and friends). Default false.",
				},
				{
					name: "hidecommands",
					values: "true, false",
					body: "Hide messages that start with an exclamation mark. Sub and raid rows are system lines rather than user messages, so this never hides them; a first message or cheer that happens to be a command is still hidden, because it is a real message underneath. Default false.",
				},
				{
					name: "hide",
					values: "comma-separated logins",
					body: "Always hide these users. Anything that fails the login pattern is dropped from the list rather than erroring.",
				},
				{
					name: "allow",
					values: "comma-separated logins",
					body: "Featured mode: show only these users and nobody else. Leave it empty to show everyone.",
				},
			],
		},
		{
			id: "advanced",
			title: "Advanced",
			blurb: "Custom badge art and how often art refetches.",
			params: [
				{
					name: "badgeart",
					values: "set=url or set/version=url pairs",
					body: "Replace badge art inline, comma separated. See custom badge art below.",
				},
				{
					name: "badgegist",
					values: "a public gist id or URL",
					body: "The same pairs, hosted in a gist so you can change badges without editing the OBS URL. See custom badge art below.",
				},
				{
					name: "refresh",
					values: "0, or 5 to 1440, minutes",
					body: "Refetch the emote and badge maps this often, so emotes added mid-stream show up without reloading the source. 0 turns it off. The floor is 5 minutes on purpose: the emote APIs are free and unauthenticated, and a tighter loop is rude to them. Default 5.",
				},
			],
		},
	];

// One list drives the sidebar and the scroll spy, so a new section
// cannot appear in one and not the other.
const TOC = [
	{ id: "quick-start", label: "Quick start" },
	...GROUPS.map((group) => ({ id: group.id, label: group.title })),
	{ id: "themes", label: "Theme values" },
	{ id: "badge-art", label: "Custom badge art" },
	{ id: "custom-css", label: "Custom CSS" },
	{ id: "troubleshooting", label: "Troubleshooting" },
	{ id: "limits", label: "What it will not do" },
];

/**
 * Marks the section currently under the header as the active one.
 *
 * Reads scroll position rather than trusting IntersectionObserver's
 * entry order: with sections taller than the viewport, several are
 * intersecting at once and the observer gives no reliable "topmost"
 * answer. The last section whose top has passed the header is the one
 * the reader is in.
 */
function useActiveSection(ids: string[]) {
	const [activeId, setActiveId] = useState(ids[0]);

	useEffect(() => {
		const pick = () => {
			const tops = ids.flatMap((id) => {
				const el = document.getElementById(id);
				return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
			});
			setActiveId(
				pickActiveSection(tops, {
					// matches scroll-mt-24 on the sections, plus a little slack
					line: 120,
					atBottom:
						window.innerHeight + window.scrollY >=
						document.body.scrollHeight - 2,
				}) ?? ids[0],
			);
		};

		pick();

		// The observer is the trigger, not the decision: it fires whenever a
		// section edge crosses the viewport, including on programmatic
		// scrolls and layout shifts that never emit a scroll event. The
		// choice of section still comes from pick(), because with sections
		// taller than the viewport several intersect at once.
		const observer = new IntersectionObserver(pick);
		for (const id of ids) {
			const el = document.getElementById(id);
			if (el) {
				observer.observe(el);
			}
		}
		window.addEventListener("scroll", pick, { passive: true });
		window.addEventListener("resize", pick);
		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", pick);
			window.removeEventListener("resize", pick);
		};
	}, [ids]);

	return activeId;
}

const CSS_HOOKS = [
	{
		cls: "hb-root",
		body: "The overlay wrapper. Carries data-theme and the theme variables.",
	},
	{ cls: "hb-messages", body: "The scrolling message column." },
	{ cls: "hb-message", body: "One message row." },
	{ cls: "hb-name", body: "The chatter's display name." },
	{ cls: "hb-text", body: "The message body." },
	{ cls: "hb-badge", body: "One badge image before the name." },
	{
		cls: "hb-avatar",
		body: "The profile picture, when the avatars parameter is on.",
	},
	{
		cls: "hb-event-line",
		body: "The system line on an event row. The row itself carries data-event with the kind, so hb-message[data-event='raid'] targets one kind.",
	},
	{
		cls: "hb-cheermote",
		body: "The bits tier image on a cheer row.",
	},
	{
		cls: "hb-pronoun",
		body: "The text pronoun badge, when the pronouns parameter is on.",
	},
	{ cls: "hb-time", body: "The timestamp, when timestamps is on." },
	{ cls: "hb-sep", body: "The colon between the name and the message." },
	{ cls: "hb-emote", body: "One emote image inside the message body." },
	{
		cls: "hb-status",
		body: "The connecting / disconnected / could not join pill.",
	},
];

const TROUBLE = [
	{
		q: "The source is blank in OBS",
		a: "Check the channel parameter first. A login that fails the Twitch pattern is dropped, and the overlay shows a status pill rather than joining. If the pill says it could not join, the channel name is wrong or the channel does not exist. If there is no pill at all, the URL is missing channel entirely.",
	},
	{
		q: "Nothing appears until someone talks",
		a: "That is the design. There is no backlog to load: anonymous IRC receives messages from the moment it connects, so an empty channel is an empty overlay. Open the channel in a browser and send a message to test.",
	},
	{
		q: "The text is blurry",
		a: "The browser source was resized with the transform handles instead of in its properties. Reset the transform, set Width and Height in the source properties, and use size in the URL to change how large the text renders.",
	},
	{
		q: "Messages stop arriving after a scene change",
		a: 'Turn off "Shutdown source when not visible" and "Refresh browser when scene becomes active" in the source properties. Both fight a live connection. HowlBox reconnects on visibility and network events rather than on a timer, because OBS throttles timers in hidden sources.',
	},
	{
		q: "7TV or BTTV emotes are missing",
		a: "Those services only return emotes for channels that have set them up. If the channel has no 7TV account, there are no 7TV emotes to fetch. Channel emotes override globals, and results are cached in localStorage, so a change on their side shows up on the next refresh interval.",
	},
	{
		q: "Custom badge art is not showing",
		a: "Check precedence: fetched Twitch art loses to badgegist, which loses to inline badgeart. A bare set key covers every version of that set, so moderator=... beats nothing but is beaten by moderator/1=.... The image URL has to be reachable from the browser and served with permissive CORS.",
	},
];

function DocsPage() {
	const ids = useMemo(() => TOC.map((item) => item.id), []);
	const activeId = useActiveSection(ids);

	return (
		<SiteShell>
			<div className="mx-auto max-w-6xl px-6 pt-12 pb-24">
				<div className="mb-8">
					<BackLink />
				</div>

				<div className="max-w-3xl">
					<p className={`hb-text-brand text-xs ${MONO}`}>Docs</p>
					<h1 className="hb-display mt-5 text-balance text-4xl lg:text-5xl">
						Every parameter, every hook
					</h1>
					<p className="hb-text-2 mt-4 text-pretty text-lg leading-relaxed">
						The overlay has no settings screen and no stored state. The URL is
						the config file, so this page is the reference for it. If you would
						rather click than type,{" "}
						<Link
							className="text-[color:var(--site-brand-text)] underline underline-offset-2"
							to="/config"
						>
							the builder writes the same URL
						</Link>
						.
					</p>
				</div>

				<div className="mt-14 grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
					{/* in-page nav; sticky on desktop, a plain list on mobile */}
					<nav
						aria-label="On this page"
						className="hb-hairline h-max border-t pt-6 lg:sticky lg:top-24"
					>
						<p className={`hb-text-2 text-[0.65rem] ${MONO}`}>On this page</p>
						<ul className="mt-4 flex flex-col gap-2.5 text-sm">
							{TOC.map((item) => {
								const current = item.id === activeId;
								return (
									<li key={item.id}>
										<a
											aria-current={current ? "location" : undefined}
											className={
												current
													? "-ml-3 block border-[color:var(--site-brand)] border-l-2 pl-[0.625rem] font-medium text-[color:var(--site-txt-1)]"
													: "-ml-3 block border-transparent border-l-2 pl-[0.625rem] text-[color:var(--site-txt-2)] transition-colors hover:text-[color:var(--site-txt-1)]"
											}
											href={`#${item.id}`}
										>
											{item.label}
										</a>
									</li>
								);
							})}
						</ul>
					</nav>

					{/* 68ch: prose past roughly 75 characters per line costs the
					    reader the start of the next line, and this page is read
					    top to bottom rather than scanned */}
					<div className="flex max-w-[34rem] flex-col gap-16">
						{/* quick start */}
						<section className="scroll-mt-24" id="quick-start">
							<h2 className="hb-display text-2xl">Quick start</h2>
							<p className="hb-text-2 mt-3 leading-relaxed">
								A HowlBox URL is the site address, then{" "}
								<code className="hb-code">/overlay</code>, then your options:
							</p>
							<pre className="hb-card mt-4 w-fit max-w-full overflow-x-auto p-4">
								<code className="font-mono text-sm">
									https://mrdemonwolf.github.io/howlbox/overlay?channel=mrdemonwolf&amp;theme=wolf&amp;bg=bubble
								</code>
							</pre>
							<ol className="mt-6 flex list-decimal flex-col gap-3 pl-5 leading-relaxed">
								<li>
									In OBS: Sources, plus, Browser. Paste the URL into the address
									field.
								</li>
								<li>
									Set Width and Height in the source properties. 480 x 800 is a
									reasonable start.
								</li>
								<li>
									Leave "Shutdown source when not visible" and "Refresh browser
									when scene becomes active" unchecked. Both fight a live chat
									connection.
								</li>
							</ol>
							<p className="hb-text-2 mt-6 leading-relaxed">
								Every parameter below is optional except{" "}
								<code className="hb-code">channel</code>. A value the schema
								rejects falls back to its default rather than failing, so a typo
								in an OBS URL degrades to a working overlay instead of a blank
								source.
							</p>
						</section>

						{/* parameter groups */}
						{GROUPS.map((group) => (
							<section className="scroll-mt-24" id={group.id} key={group.id}>
								<h2 className="hb-display text-2xl">{group.title}</h2>
								<p className="hb-text-2 mt-3 leading-relaxed">{group.blurb}</p>
								<dl className="mt-6 flex flex-col gap-6">
									{group.params.map((param) => (
										<div
											className="hb-hairline scroll-mt-24 border-t pt-5"
											id={`param-${param.name}`}
											key={param.name}
										>
											{/* the anchor exists so writeups can deep-link a
											    single parameter; without a control the reader
											    has no way to get that URL */}
											<dt className="group flex flex-wrap items-baseline gap-x-3 gap-y-1">
												<a
													className="inline-flex items-baseline gap-1.5"
													href={`#param-${param.name}`}
												>
													<code className="hb-code font-semibold text-base">
														{param.name}
													</code>
													<Link2
														aria-hidden
														className="size-3.5 shrink-0 self-center text-[color:var(--site-brand-text)] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
													/>
													<span className="sr-only">
														Link to the {param.name} parameter
													</span>
												</a>
												<span className="hb-text-2 text-sm">
													{param.values}
												</span>
											</dt>
											<dd className="hb-text-2 mt-2 leading-relaxed">
												{param.body}
											</dd>
										</div>
									))}
								</dl>
							</section>
						))}

						{/* themes */}
						<section className="scroll-mt-24" id="themes">
							<h2 className="hb-display text-2xl">Theme values</h2>
							<p className="hb-text-2 mt-3 leading-relaxed">
								The value on the left is what goes in the URL. Every theme is
								previewed on{" "}
								<Link
									className="text-[color:var(--site-brand-text)] underline underline-offset-2"
									hash="themes"
									to="/"
								>
									the theme wall
								</Link>
								.
							</p>
							<ul className="mt-6 grid gap-2 sm:grid-cols-2">
								{THEMES.map((theme) => (
									<li
										className="hb-hairline flex items-baseline justify-between gap-4 border-b py-2"
										key={theme}
									>
										<code className="hb-code">{theme}</code>
										<span className="hb-text-2 text-sm">
											{THEME_LABEL[theme]}
										</span>
									</li>
								))}
							</ul>
						</section>

						{/* badge art */}
						<section className="scroll-mt-24" id="badge-art">
							<h2 className="hb-display text-2xl">Custom badge art</h2>
							<p className="hb-text-2 mt-3 leading-relaxed">
								Global and channel badges already load on their own. These two
								parameters exist to swap in your own art, keyed by badge set.
							</p>

							<h3 className="mt-6 font-semibold text-lg">
								Inline, with badgeart
							</h3>
							<p className="hb-text-2 mt-2 leading-relaxed">
								Comma-separated <code className="hb-code">set=url</code> pairs.
								Add <code className="hb-code">/version</code> after the set name
								to target one tier of a badge that has several.
							</p>
							<pre className="hb-card mt-4 w-fit max-w-full overflow-x-auto p-4">
								<code className="font-mono text-sm">
									&amp;badgeart=moderator=https://example.com/mod.png,subscriber/12=https://example.com/1yr.png
								</code>
							</pre>

							<h3 className="mt-8 font-semibold text-lg">
								Hosted, with badgegist
							</h3>
							<p className="hb-text-2 mt-2 leading-relaxed">
								Point at a public GitHub gist holding the same pairs, one per
								line, or a JSON map. The advantage is that you edit the gist
								instead of editing the URL in OBS, so badge art can change
								without touching your scene collection.
							</p>
							<pre className="hb-card mt-4 w-fit max-w-full overflow-x-auto p-4">
								<code className="font-mono text-sm">
									moderator=https://example.com/mod.png
									<br />
									vip=https://example.com/vip.png
								</code>
							</pre>

							<h3 className="mt-8 font-semibold text-lg">Precedence</h3>
							<p className="hb-text-2 mt-2 leading-relaxed">
								Weakest to strongest: fetched Twitch art, then{" "}
								<code className="hb-code">badgegist</code>, then inline{" "}
								<code className="hb-code">badgeart</code>. A bare set key with
								no version covers every version of that set, and a keyed version
								beats it.
							</p>
							<p className="hb-text-2 mt-3 leading-relaxed">
								The gist is read through the public GitHub API with no token,
								which allows 60 unauthenticated requests per hour per IP. The
								default 5-minute refresh interval and its 5-minute floor keep a
								gist far under that, so there is nothing to tune.
							</p>
						</section>

						{/* custom css */}
						<section className="scroll-mt-24" id="custom-css">
							<h2 className="hb-display text-2xl">Custom CSS</h2>
							<p className="hb-text-2 mt-3 leading-relaxed">
								OBS browser sources have a Custom CSS field. Every element in
								the overlay carries a stable{" "}
								<code className="hb-code">hb-*</code> class for it. These names
								are treated as a public contract and are not renamed.
							</p>
							<dl className="mt-6 flex flex-col gap-3">
								{CSS_HOOKS.map((hook) => (
									<div
										className="hb-hairline flex flex-col gap-1 border-b pb-3 sm:flex-row sm:items-baseline sm:gap-4"
										key={hook.cls}
									>
										<dt className="sm:w-40 sm:shrink-0">
											<code className="hb-code">.{hook.cls}</code>
										</dt>
										<dd className="hb-text-2 text-sm leading-relaxed">
											{hook.body}
										</dd>
									</div>
								))}
							</dl>
							<p className="hb-text-2 mt-6 leading-relaxed">
								The theme variables are overridable the same way. To keep a
								theme but change one color:
							</p>
							<pre className="hb-card mt-4 w-fit max-w-full overflow-x-auto p-4">
								<code className="font-mono text-sm">
									{".hb-root { --hb-text: #ffd6f2; }"}
								</code>
							</pre>
							<p className="hb-text-2 mt-4 leading-relaxed">
								One constraint worth knowing before you reach for it:{" "}
								<code className="hb-code">backdrop-filter</code> cannot blur
								your game feed. OBS composites video outside the page, and CSS
								only samples page pixels, so a blur there sees nothing. The
								themes fake glass with gradient fills, hairline borders, and
								noise instead.
							</p>
						</section>

						{/* troubleshooting */}
						<section className="scroll-mt-24" id="troubleshooting">
							<h2 className="hb-display text-2xl">Troubleshooting</h2>
							<dl className="mt-6 flex flex-col gap-6">
								{TROUBLE.map((item) => (
									<div className="hb-hairline border-t pt-5" key={item.q}>
										<dt className="font-semibold">{item.q}</dt>
										<dd className="hb-text-2 mt-2 leading-relaxed">{item.a}</dd>
									</div>
								))}
							</dl>
						</section>

						{/* limits */}
						<section className="scroll-mt-24" id="limits">
							<h2 className="hb-display text-2xl">What it will not do</h2>
							<p className="hb-text-2 mt-3 leading-relaxed">
								HowlBox reads chat anonymously. That is the whole reason it
								needs no account, and it is also the boundary of what it can
								ever show you. Anonymous IRC cannot see anything Twitch gates
								behind a token, so none of the following is coming:
							</p>
							<ul className="hb-text-2 mt-5 flex list-disc flex-col gap-2 pl-5 leading-relaxed">
								<li>Sending messages, timeouts, or bans from the overlay.</li>
								<li>
									The mod queue, AutoMod holds, or deleted message contents.
								</li>
								<li>
									Follower alerts. Follows only arrive over EventSub, which
									needs an authenticated app. Subs, gifts, raids and cheers do
									come down anonymous IRC, and the events parameter renders
									them.
								</li>
								<li>
									Chat history from before the source connected. There is no
									backlog on IRC.
								</li>
								<li>
									Whispers, or anything from a channel you are not joined to.
								</li>
							</ul>
							<p className="hb-text-2 mt-5 leading-relaxed">
								If you need any of that, you need an overlay with a backend and
								an OAuth app. That is a real tradeoff, not a missing feature.
							</p>
						</section>
					</div>
				</div>
			</div>
		</SiteShell>
	);
}
