import { defineConfig, devices } from "@playwright/test";

const basePath = process.env.BASE_PATH ?? "/";
const baseURL = `http://127.0.0.1:4173${basePath}`;

export default defineConfig({
	testDir: "./apps/web/e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	outputDir: "node_modules/.cache/playwright-results",
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "bun run serve --host 127.0.0.1 --port 4173 --strictPort",
		cwd: "apps/web",
		url: baseURL,
		reuseExistingServer: false,
		timeout: 30_000,
	},
});
