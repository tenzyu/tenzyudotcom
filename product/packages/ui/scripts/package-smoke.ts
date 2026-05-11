import { existsSync } from "node:fs";
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

const outdir = join("/tmp", "tenzyu-ui-package-smoke");
const packageRoot = new URL("..", import.meta.url).pathname;
const distRoot = join(packageRoot, "dist");
const packageJson = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
) as {
  exports: Record<string, string | { import?: string; types?: string; default?: string }>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

await rm(outdir, { force: true, recursive: true });

function assertExists(relativePath: string) {
  const absolutePath = join(packageRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`package export points at a missing file: ${relativePath}`);
  }
}

async function assertWildcardExports() {
  const topLevelFiles = await readdir(distRoot);
  const missingTypes = topLevelFiles
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => fileName.replace(/\.js$/, ".d.ts"))
    .filter((typeFileName) => !existsSync(join(distRoot, typeFileName)));

  if (missingTypes.length > 0) {
    throw new Error(`missing declaration files for JS exports: ${missingTypes.join(", ")}`);
  }

  const advancedRoot = join(distRoot, "advanced");
  const advancedFiles = existsSync(advancedRoot) ? await readdir(advancedRoot) : [];
  const missingAdvancedTypes = advancedFiles
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => fileName.replace(/\.js$/, ".d.ts"))
    .filter((typeFileName) => !existsSync(join(advancedRoot, typeFileName)));

  if (missingAdvancedTypes.length > 0) {
    throw new Error(`missing declaration files for advanced exports: ${missingAdvancedTypes.join(", ")}`);
  }
}

for (const [subpath, target] of Object.entries(packageJson.exports)) {
  if (subpath === "./package.json" || subpath.includes("*")) continue;

  if (typeof target === "string") {
    assertExists(target);
    continue;
  }

  if (target.import) assertExists(target.import);
  if (target.types) assertExists(target.types);
}

await assertWildcardExports();

const result = await Bun.build({
  entrypoints: [new URL("../tests/package-smoke-entry.ts", import.meta.url).pathname],
  outdir,
  target: "browser",
  external: Object.keys(packageJson.peerDependencies ?? {}),
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
