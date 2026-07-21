import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

// OBS transparency must not wait for React or the lazy route chunk,
// or the app shell flashes opaque white in the scene at load
if (/\/overlay\/?$/.test(window.location.pathname)) {
	document.documentElement.classList.add("hb-overlay");
} else {
	// Resolve light/dark before the first paint, otherwise the page shows
	// one mode and repaints into the other. next-themes takes over on
	// mount and reads the same storage key, so this only has to be right
	// for the very first frame.
	const stored = localStorage.getItem("theme");
	const dark =
		stored === "dark" ||
		((!stored || stored === "system") &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList.add(dark ? "dark" : "light");
}

const router = createRouter({
	routeTree,
	// match routes under the GitHub Pages /howlbox/ subpath
	basepath: import.meta.env.BASE_URL,
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultPendingComponent: () => <Loader />,
	context: {},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<RouterProvider router={router} />);
}
