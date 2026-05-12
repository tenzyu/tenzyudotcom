import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { catalogedComponentFiles, storybookCategoryRules } from "../src/stories/_catalog";

const packageRoot = new URL("..", import.meta.url).pathname;
const componentsDir = join(packageRoot, "src/components/ui");
const storiesDir = join(packageRoot, "src/stories");

const componentFiles = readdirSync(componentsDir)
  .filter((fileName) => fileName.endsWith(".tsx"))
  .map((fileName) => fileName.replace(/\.tsx$/, ""))
  .sort();

const missingFromCatalog = componentFiles.filter(
  (fileName) => !catalogedComponentFiles.includes(fileName as never),
);

const staleCatalogEntries = catalogedComponentFiles.filter(
  (fileName) => !componentFiles.includes(fileName),
);

if (missingFromCatalog.length > 0) {
  throw new Error(`Storybook catalog is missing components: ${missingFromCatalog.join(", ")}`);
}

if (staleCatalogEntries.length > 0) {
  throw new Error(`Storybook catalog contains stale entries: ${staleCatalogEntries.join(", ")}`);
}

if (!existsSync(join(packageRoot, "src/normalize.css"))) {
  throw new Error("@tenzyu/ui must expose product-neutral normalize.css");
}

const storyFiles = readdirSync(storiesDir).filter((fileName) => fileName.endsWith(".stories.tsx"));
for (const storyFile of storyFiles) {
  const content = readFileSync(join(storiesDir, storyFile), "utf8");
  if (!content.includes(storybookCategoryRules.allowedTitlePrefix)) {
    throw new Error(`${storyFile} must use title prefix ${storybookCategoryRules.allowedTitlePrefix}`);
  }

  const lowered = content.toLowerCase();
  const forbidden = storybookCategoryRules.forbiddenProductTerms.filter((term) =>
    lowered.includes(term.toLowerCase()),
  );
  if (forbidden.length > 0) {
    throw new Error(`${storyFile} contains product-specific terms: ${forbidden.join(", ")}`);
  }
}

console.log(`Storybook catalog covers ${componentFiles.length} primitive components.`);
