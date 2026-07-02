import { Toaster } from "@howlbox/ui/components/sonner";
import { createFileRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			disableTransitionOnChange
			storageKey="vite-ui-theme"
		>
			<div className="grid h-svh grid-rows-[auto_1fr]">
				<Header />
				<main className="container mx-auto max-w-3xl px-4 py-8">
					<h1 className="font-bold text-2xl">HowlBox</h1>
					<p className="mt-2 text-muted-foreground">
						The overlay URL generator lands here. Until then, hand-write a URL
						like /overlay?channel=yourname&bg=off&theme=wolf
					</p>
				</main>
			</div>
			<Toaster richColors />
			<TanStackRouterDevtools position="bottom-left" />
		</ThemeProvider>
	);
}
