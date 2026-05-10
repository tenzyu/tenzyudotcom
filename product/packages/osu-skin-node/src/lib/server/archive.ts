import { copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { safeJoin, toPosixPath } from "./fs-path";

const execFileAsync = promisify(execFile);

export async function emptyDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

export async function walkRelativeFiles(root: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      result.push(toPosixPath(path.relative(root, fullPath)));
    }
  }

  await walk(root);

  return result.sort((a, b) => a.localeCompare(b));
}

export async function copyTree(sourceRoot: string, outputRoot: string): Promise<void> {
  await emptyDir(outputRoot);

  for (const relativePath of await walkRelativeFiles(sourceRoot)) {
    const source = path.join(sourceRoot, relativePath);
    const target = safeJoin(outputRoot, relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

export type CopyTreeFilter = (relativePath: string) => boolean | Promise<boolean>;

export async function copyTreeFiltered(
  sourceRoot: string,
  outputRoot: string,
  filter: CopyTreeFilter,
): Promise<{ copied: number; skipped: number }> {
  await emptyDir(outputRoot);

  let copied = 0;
  let skipped = 0;

  for (const relativePath of await walkRelativeFiles(sourceRoot)) {
    if (!(await filter(relativePath))) {
      skipped += 1;
      continue;
    }

    const source = path.join(sourceRoot, relativePath);
    const target = safeJoin(outputRoot, relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    copied += 1;
  }

  return { copied, skipped };
}

export async function zipDirectory(sourceRoot: string, outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await execFileAsync("zip", ["-qr", outputPath, "."], { cwd: sourceRoot });
}

export async function extractOsk(sourcePath: string, outputRoot: string): Promise<void> {
  await mkdir(outputRoot, { recursive: true });

  const { stdout } = await execFileAsync("unzip", ["-Z1", sourcePath]);

  for (const member of stdout.split("\n").filter(Boolean)) {
    const normalized = toPosixPath(member);

    if (path.isAbsolute(member) || normalized.split("/").includes("..")) {
      throw new Error(`refusing unsafe archive member: ${member}`);
    }
  }

  await execFileAsync("unzip", ["-qq", sourcePath, "-d", outputRoot]);
}

export async function withResolvedSkinSource<T>(
  sourcePath: string,
  action: (sourceRoot: string) => Promise<T>,
): Promise<T> {
  const sourceInfo = await stat(sourcePath).catch(() => null);

  if (!sourceInfo) {
    throw new Error(`source does not exist: ${sourcePath}`);
  }

  if (sourceInfo.isDirectory()) {
    return action(sourcePath);
  }

  if (sourceInfo.isFile() && sourcePath.toLowerCase().endsWith(".osk")) {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "osu-skin-editor-"));

    try {
      const extractedRoot = path.join(tempRoot, path.basename(sourcePath, path.extname(sourcePath)));
      await extractOsk(sourcePath, extractedRoot);
      return await action(extractedRoot);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  throw new Error(`source must be an .osk file or extracted skin folder: ${sourcePath}`);
}

