import { execSync } from "node:child_process";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { seoPlugin } from "./vite-plugin-seo";

// The footer names the commit it was built from. CI passes COMMIT_SHA
// (declared in turbo.json env so the cache cannot bake a stale hash);
// local builds fall back to git; anything else says dev.
function resolveCommit(): string {
	if (process.env.COMMIT_SHA) {
		return process.env.COMMIT_SHA;
	}
	try {
		return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
	} catch {
		return "dev";
	}
}

export default defineConfig({
	// GitHub Pages project sites serve at /<repo>/; CI sets BASE_PATH
	base: process.env.BASE_PATH ?? "/",
	define: {
		__COMMIT_HASH__: JSON.stringify(resolveCommit()),
	},
	server: {
		// PORT lets parallel worktrees run side by side; 3001 stays the default
		port: process.env.PORT ? Number(process.env.PORT) : 3001,
		// Vite rejects an unrecognized Host header by default. A cloudflared
		// quick tunnel (see .claude/launch.json "tunnel") proxies through a
		// random *.trycloudflare.com hostname each run, so the suffix is
		// allowed rather than one fixed host. Dev server only, never built.
		allowedHosts: [".trycloudflare.com"],
	},
	resolve: {
		tsconfigPaths: true,
		// packages/ui declares its own react; without dedupe the
		// base-ui field components resolve a second copy and crash
		dedupe: ["react", "react-dom"],
	},
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		seoPlugin(),
	],
});
