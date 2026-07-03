import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	// GitHub Pages project sites serve at /<repo>/; CI sets BASE_PATH
	base: process.env.BASE_PATH ?? "/",
	server: {
		port: 3001,
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
	],
});
