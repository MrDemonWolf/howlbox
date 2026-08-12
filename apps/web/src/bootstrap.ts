const isOverlay = /\/overlay\/?$/.test(window.location.pathname);

if (isOverlay) {
	document.documentElement.classList.add("hb-overlay");
	document.documentElement.style.background = "transparent";
	document.body.style.background = "transparent";
	void import("./overlay-main").catch(() => {
		const app = document.getElementById("app");
		if (!app) return;
		const notice = document.createElement("div");
		notice.setAttribute("role", "alert");
		notice.textContent =
			"Overlay could not start, check the URL and reload the source";
		notice.style.cssText =
			"position:absolute;top:8px;left:8px;padding:4px 8px;border-radius:6px;background:rgb(0 0 0 / 70%);color:white;font:12px system-ui,sans-serif";
		app.replaceChildren(notice);
	});
} else {
	void import("./main");
}
