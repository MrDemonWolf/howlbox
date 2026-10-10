import { expect, test } from "@playwright/test";

const basePathPart = (process.env.BASE_PATH ?? "/").replace(/^\/+|\/+$/g, "");
const siteBasePath = basePathPart ? `/${basePathPart}` : "";
const baseURL = `http://127.0.0.1:4173${siteBasePath}/`;
const docsPath = `${siteBasePath}/docs`;

test("landing page opens Docs from its main actions", async ({ page }) => {
	await page.goto("./");

	await expect(page.getByRole("heading", { level: 1 })).toContainText(
		"The whole overlay",
	);
	await page.getByRole("link", { name: "Read the docs" }).click();
	await expect(page).toHaveURL(new URL("docs/", baseURL).toString());
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"HowlBox documentation",
	);
});

test("Docs redirects its old custom badge deep link", async ({ page }) => {
	await page.goto("./docs/#badge-art");

	await expect(page).toHaveURL(
		new URL("docs/custom-badges/#badge-art", baseURL).toString(),
	);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Custom badge art",
	);
	await expect(page.locator("#badge-art")).toBeAttached();
});

test("Fumadocs static search includes the URL reference", async ({ page }) => {
	await page.goto("./docs/");
	const response = await page.request.get(
		new URL(`${docsPath}/api/search`, baseURL).toString(),
	);
	await expect(response).toBeOK();
	const index = (await response.text()).toLowerCase();
	expect(index).toContain("scrollspeed");
	expect(index).toContain("custom badge art");
});

test("Fumadocs keeps its pages, metadata, assets and search under BASE_PATH", async ({
	page,
}) => {
	const siteOrigin = new URL(baseURL).origin;
	const sitePrefix = siteBasePath ? `${siteBasePath}/` : "/";
	const escapedPaths: string[] = [];
	await page.route("**/*", async (route) => {
		const requestUrl = new URL(route.request().url());
		if (
			requestUrl.origin === siteOrigin &&
			!requestUrl.pathname.startsWith(sitePrefix)
		) {
			escapedPaths.push(requestUrl.pathname);
			await route.abort();
			return;
		}
		await route.continue();
	});

	await page.goto("./");
	await page.getByRole("link", { name: "Read the docs" }).click();
	await expect(page).toHaveURL(new URL("docs/", baseURL).toString());
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		`https://howlbox.mrdemonwolf.dev${docsPath}/`,
	);
	await expect(
		page.locator('link[rel="stylesheet"][href*="/_next/static/"]').first(),
	).toHaveAttribute("href", new RegExp(`^${docsPath}/_next/static/`));
	const response = await page.request.get(
		new URL(`${docsPath}/api/search`, baseURL).toString(),
	);
	await expect(response).toBeOK();

	await page.goto("./docs/getting-started/");
	const configuratorLink = page.locator('article a[href$="/config/"]').first();
	await expect(configuratorLink).toHaveAttribute(
		"href",
		`${siteBasePath}/config/`,
	);
	await configuratorLink.click();
	await expect(page).toHaveURL(new URL("config/", baseURL).toString());

	await page.goto("./docs/themes/");
	const landingLink = page.locator('article a[href$="/#themes"]').first();
	await expect(landingLink).toHaveAttribute("href", `${siteBasePath}/#themes`);
	await landingLink.click();
	await expect(page).toHaveURL(new URL("#themes", baseURL).toString());
	expect(escapedPaths).toEqual([]);
});

test("Fumadocs search finds URL parameters", async ({ page }) => {
	await page.goto("./docs/");
	await page.locator("[data-search-full]").click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("textbox").fill("scrollspeed");
	await expect(dialog).toContainText("Overlay URL reference");
});

test("Fumadocs pages fit a 320px viewport", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("./docs/url-reference/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Overlay URL reference",
	);
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(320);
});

test("builder explains the required channel and writes its URL", async ({
	page,
}) => {
	await page.goto("./config/");

	await expect(page.getByRole("alert")).toContainText(
		"Twitch channel is required",
	);
	await page.getByLabel(/Twitch channel/).fill("wolf_friend");
	await expect(
		page.getByRole("region", { name: "Generated overlay URL" }),
	).toContainText(/channel=wolf_friend/);
	await expect(
		page.getByRole("link", { name: "Open preview" }),
	).not.toHaveAttribute("aria-disabled", "true");
});

test("builder imports a legacy Pages link and emits the custom-domain URL", async ({
	page,
}) => {
	await page.goto("./config/");
	await page
		.getByRole("textbox", { name: "Existing overlay URL" })
		.fill(
			"https://mrdemonwolf.github.io/howlbox/overlay?channel=wolf_friend&theme=neon&bg=panel",
		);
	await page.getByRole("button", { name: "Load" }).click();

	await expect(
		page.getByRole("region", { name: "Generated overlay URL" }),
	).toContainText(
		"https://howlbox.mrdemonwolf.dev/overlay?channel=wolf_friend&theme=neon&bg=panel",
	);
});

test("builder switches its preview between demo and live chat", async ({
	page,
}) => {
	await page.route("**/*", (route) =>
		route.request().url().startsWith("http://127.0.0.1:4173/")
			? route.continue()
			: route.abort(),
	);
	let liveSocketAttempts = 0;
	// Leave the mock socket open; closing it triggers the chat retry policy.
	await page.routeWebSocket("wss://**/*", () => {
		liveSocketAttempts += 1;
	});
	await page.goto("./config/");

	const preview = page.locator(".hb-root");
	await expect
		.poll(() => preview.evaluate((node) => node.getBoundingClientRect().height))
		.toBeLessThanOrEqual(500);
	const liveToggle = page.getByRole("checkbox", {
		name: "Use live Twitch chat",
	});
	await expect(liveToggle).not.toBeChecked();
	const demoNames = preview.locator(".hb-name");
	await expect(demoNames.nth(0)).toHaveText("MoonHowler");
	await expect(demoNames.nth(1)).toHaveText("MoonHowler");
	await expect(demoNames.nth(2)).toHaveText("MoonHowler");
	await expect(demoNames.nth(3)).toHaveText("LunaTheWolf");
	await expect(preview.getByText("MrDemonWolf", { exact: true })).toBeVisible();
	await expect(preview.locator(".hb-owner-badge").first()).toHaveAttribute(
		"aria-label",
		"MrDemonWolf owner badge",
	);
	await expect(
		preview
			.locator(
				'.hb-owner-badge img[src="https://www.mrdemonwolf.com/wp-content/uploads/2022/12/logo.svg"]',
			)
			.first(),
	).toBeVisible();

	await liveToggle.check();
	await expect(preview).toContainText(
		"Enter a valid Twitch channel above to preview live chat.",
	);
	await page.clock.install();
	const channelInput = page.getByLabel(/Twitch channel/);
	await channelInput.fill("old_channel");
	await page.clock.fastForward(500);
	await expect.poll(() => liveSocketAttempts).toBe(1);
	await expect(preview.locator(".hb-status")).toBeVisible();
	await expect(preview.getByText("MrDemonWolf", { exact: true })).toHaveCount(
		0,
	);

	// While editing to another channel, an invalid intermediate value keeps
	// the last settled connection until the new login has been stable for 500ms.
	await channelInput.fill("new_channel!");
	await expect(liveToggle).toHaveAccessibleDescription(
		/preview stays on the last valid channel/,
	);
	await channelInput.fill("new_channel");
	await page.clock.fastForward(499);
	await expect.poll(() => liveSocketAttempts).toBe(1);
	await page.clock.fastForward(1);
	await expect.poll(() => liveSocketAttempts).toBe(2);

	await liveToggle.uncheck();
	await expect(preview.getByText("MrDemonWolf", { exact: true })).toBeVisible();
});

test("overlay gives setup guidance when no channel is configured", async ({
	page,
}) => {
	await page.goto("./overlay/?theme=invalid");

	await expect(page.getByRole("alert")).toContainText(
		"Add ?channel=your_twitch_name",
	);
});

test("overlay renders its active theme and URL settings offline", async ({
	page,
}) => {
	await page.route("**/*", (route) =>
		route.request().url().startsWith("http://127.0.0.1:4173/")
			? route.continue()
			: route.abort(),
	);
	await page.routeWebSocket("wss://**/*", (socket) =>
		socket.close({ code: 1000, reason: "external chat blocked in E2E" }),
	);
	await page.goto(
		"./overlay/?channel=wolf_friend&theme=neon&variant=cyan&layout=stacked&align=right&bg=off",
	);

	const root = page.locator(".hb-root");
	await expect(root).toBeVisible();
	await expect(root).toHaveAttribute("data-theme", "neon");
	await expect(root).toHaveAttribute("data-variant", "cyan");
	await expect(root).toHaveAttribute("data-layout", "stacked");
	await expect(root).toHaveAttribute("data-align", "right");
	await expect(root).toHaveAttribute("data-bg", "off");
});

test("legal link hover only highlights the hovered link", async ({ page }) => {
	await page.goto("./privacy/");
	const content = page.locator("#main");
	const discord = content.getByRole("link", {
		name: "Discord",
		exact: true,
	});
	const site = content.getByRole("link", {
		name: "mrdemonwolf.com",
		exact: true,
	});
	const color = (link: typeof discord) =>
		link.evaluate((node) => getComputedStyle(node).color);
	const discordColor = await color(discord);
	const siteColor = await color(site);

	await discord.hover();
	await expect.poll(() => color(discord)).not.toBe(discordColor);
	await expect.poll(() => color(site)).toBe(siteColor);
});
