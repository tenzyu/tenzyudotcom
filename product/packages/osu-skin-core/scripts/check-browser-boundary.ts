import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const src = path.join(root, "src");
const forbidden = [/from ["']node:/, /from ["']fs["']/, /from ["']path["']/, /from ["']child_process["']/, /from ["']os["']/];
const failures: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.endsWith(".ts") && !full.endsWith(".tsx")) continue;
    const text = readFileSync(full, "utf8");
    if (forbidden.some((pattern) => pattern.test(text))) {
      failures.push(path.relative(root, full));
    }
  }
}

walk(src);

if (failures.length) {
  console.error("Browser boundary violation in @tenzyu/osu-skin-core:");
  for (const file of failures) console.error(`- ${file}`);
  process.exit(1);
}
