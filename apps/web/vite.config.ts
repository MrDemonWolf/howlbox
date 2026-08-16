import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { seoPlugin } from "./vite-plugin-seo";

export default defineConfig({
	// GitHub Pages project sites serve at /<repo>/; CI sets BASE_PATH
	base: process.env.BASE_PATH ?? "/",
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
