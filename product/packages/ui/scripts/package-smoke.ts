import { rm } from "node:fs/promises";
import { join } from "node:path";

const outdir = join("/tmp", "tenzyu-ui-package-smoke");

await rm(outdir, { force: true, recursive: true });

const result = await Bun.build({
  entrypoints: [new URL("../tests/package-smoke-entry.ts", import.meta.url).pathname],
  outdir,
  target: "browser",
  external: [
    "@base-ui/react",
    "cmdk",
    "embla-carousel-react",
    "input-otp",
    "next-themes",
    "react",
    "react-dom",
    "react-day-picker",
    "react-hook-form",
    "react-resizable-panels",
    "recharts",
    "sonner",
    "vaul",
  ],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
