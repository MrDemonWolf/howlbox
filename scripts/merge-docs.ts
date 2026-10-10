import { cp, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const siteDist = join(root, "apps/web/dist");
const docsOut = join(root, "apps/docs/out");
const protectedPaths = [
	"index.html",
	"config/index.html",
	"overlay/index.html",
];

await stat(join(siteDist, "index.html"));
await stat(join(docsOut, "index.html"));

const protectedFiles = await Promise.all(
	protectedPaths.map(
		async (path) => [path, await readFile(join(siteDist, path))] as const,
	),
);

await cp(docsOut, join(siteDist, "docs"), { recursive: true, force: true });

for (const [path, original] of protectedFiles) {
	const merged = await readFile(join(siteDist, path));
	if (!original.equals(merged)) {
		throw new Error(
			`Merging Fumadocs changed the existing site route: ${path}`,
		);
	}
}
