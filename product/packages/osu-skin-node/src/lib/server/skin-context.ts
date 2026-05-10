import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  emptySkinContext,
  parseSkinIniContext,
  type SkinClassificationContext,
} from "@tenzyu/osu-skin-core/lib/classification/skin-ini-context";

export async function skinContextForRoot(root: string): Promise<SkinClassificationContext> {
  const content = await readFile(path.join(root, "skin.ini"), "utf8").catch(() => "");
  return content ? parseSkinIniContext(content) : emptySkinContext();
}
