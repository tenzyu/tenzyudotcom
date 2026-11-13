import { rm } from "node:fs/promises";
import { join } from "node:path";

const outdir = join("/tmp", "tenzyu-osu-skin-core-package-smoke");

await rm(outdir, { force: true, recursive: true });

const result = await Bun.build({
  entrypoints: [new URL("../tests/package-smoke-entry.ts", import.meta.url).pathname],
  outdir,
  target: "browser",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
