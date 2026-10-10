import {
	defineConfig,
	defineDocs,
	frontmatterSchema,
	metaSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

const docs = defineDocs({
	dir: "content/docs",
	docs: {
		schema: frontmatterSchema.extend({
			keywords: z.array(z.string()).optional(),
		}),
	},
	meta: { schema: metaSchema },
});

export { docs };

export default defineConfig({});
