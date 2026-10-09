import { expect, test } from "@playwright/test";

test("landing page opens Docs from its main actions", async ({ page }) => {
	await page.goto("./");

	await expect(page.getByRole("heading", { level: 1 })).toContainText(
		"The whole overlay",
	);
	await page.getByRole("link", { name: "Read the docs" }).click();
	await expect(page).toHaveURL(/\/docs\/?$/);
	await expect(page.locator("main h1")).toBeVisible();
});

test("Docs keeps its custom badge deep link", async ({ page }) => {
	await page.goto("./docs/#badge-art");

	await expect(page.locator("#badge-art h2")).toHaveText("Custom badge art");
	await expect(page).toHaveURL(/#badge-art$/);
});

test("Docs search links to matching parameter anchors", async ({ page }) => {
	await page.goto("./docs/");
	await page
		.getByRole("searchbox", { name: "Search URL parameters" })
		.fill("ticker");

	const results = page.getByRole("list", { name: "Parameter search results" });
	await expect(results.locator('a[href="#param-scroll"]')).toBeVisible();
	const firstResult = results.getByRole("link").first();
	await page.keyboard.press("Tab");
	await expect(firstResult).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/#param-(align|scroll|scrollspeed)$/);
});

test("Docs search fits a 320px viewport", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("./docs/");
	await page
		.getByRole("searchbox", { name: "Search URL parameters" })
		.fill("ticker");

	const results = page.getByRole("list", { name: "Parameter search results" });
	await expect(results.locator('a[href="#param-scroll"]')).toBeVisible();
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
	const liveToggle = page.getByRole("checkbox", {
		name: "Use live Twitch chat",
	});
	await expect(liveToggle).not.toBeChecked();
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
