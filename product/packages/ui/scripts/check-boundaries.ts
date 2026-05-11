import { existsSync } from "node:fs";
import { join } from "node:path";

const packageRoot = new URL("..", import.meta.url).pathname;
const forbiddenPaths = [
  "src/components/site",
  "src/advanced",
  "src/workbench.css",
];

const existing = forbiddenPaths.filter((relativePath) =>
  existsSync(join(packageRoot, relativePath)),
);

if (existing.length > 0) {
  throw new Error(
    `@tenzyu/ui contains product-specific or deprecated surface: ${existing.join(", ")}. ` +
      "Run the provided rm command after applying this PR artifact.",
  );
}
