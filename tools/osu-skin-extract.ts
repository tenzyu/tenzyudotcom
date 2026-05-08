#!/usr/bin/env bun

import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  alwaysKeep,
  modes,
  type Mode,
  resolveSource,
  safeJoin,
  walkFiles
} from "./skin-lib";

function usage(exitCode = 0): never {
  const stream = exitCode === 0 ? console.log : console.error;
  stream(`Usage:
  bun run tools/osu-skin-extract.ts summary <skin-folder|skin.osk> [--json]
  bun run tools/osu-skin-extract.ts list <skin-folder|skin.osk> [--mode <mode>]... [--strict] [--json]
  bun run tools/osu-skin-extract.ts extract <skin-folder|skin.osk> <output-folder> [--mode <mode>]... [--strict] [--dry-run]

Modes: osu, taiko, catch, mania, all`);
  process.exit(exitCode);
}

function parseModeValues(values: string[] | undefined): Mode[] {
  if (!values || values.length === 0 || values.includes("all")) return [...modes];
  const unique = new Set<Mode>();
  for (const value of values) {
    if (!modes.includes(value as Mode)) throw new Error(`unknown mode: ${value}`);
    unique.add(value as Mode);
  }
  return [...unique];
}

function selectedFiles(files: Awaited<ReturnType<typeof walkFiles>>, selectedModes: Mode[], strict: boolean) {
  const requested = new Set(selectedModes);
  return files
    .map((file) => {
      let include = file.modes.some((mode) => requested.has(mode));
      if (strict && include) include = file.modes.every((mode) => requested.has(mode));
      if (alwaysKeep.has(file.relativePath.toLowerCase())) include = true;
      return { file, include };
    })
    .filter((entry) => entry.include);
}

function countModes(files: Awaited<ReturnType<typeof walkFiles>>) {
  const counts: Record<Mode | "unclassified", number> = {
    osu: 0,
    taiko: 0,
    catch: 0,
    mania: 0,
    unclassified: 0
  };
  for (const file of files) {
    if (file.modes.length === 0) counts.unclassified += 1;
    for (const mode of file.modes) counts[mode] += 1;
  }
  return counts;
}

async function runWithSource<T>(source: string, fn: (root: string) => Promise<T>): Promise<T> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "osu-skin-"));
  try {
    return await fn(await resolveSource(source, tempRoot));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function commandSummary(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    },
    allowPositionals: true
  });
  if (parsed.values.help) usage(0);
  const [source] = parsed.positionals;
  if (!source) usage(1);

  await runWithSource(source, async (root) => {
    const counts = countModes(await walkFiles(root));
    if (parsed.values.json) return console.log(JSON.stringify(counts, null, 2));
    for (const key of [...modes, "unclassified"] as const) console.log(`${key}: ${counts[key]}`);
  });
}

async function commandList(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      mode: { type: "string", multiple: true },
      strict: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    },
    allowPositionals: true
  });
  if (parsed.values.help) usage(0);
  const [source] = parsed.positionals;
  if (!source) usage(1);

  await runWithSource(source, async (root) => {
    const files = selectedFiles(await walkFiles(root), parseModeValues(parsed.values.mode), Boolean(parsed.values.strict));
    if (parsed.values.json) {
      return console.log(JSON.stringify(files.map(({ file }) => ({
        path: file.relativePath,
        modes: file.modes,
        scope: file.scope,
        category: file.category,
        group: file.groupKey,
        kind: file.kind
      })), null, 2));
    }
    for (const { file } of files) {
      console.log(`${file.relativePath}\t${file.modes.join(",") || "unclassified"}\t${file.scope}/${file.category}/${file.groupKey}`);
    }
  });
}

async function commandExtract(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      mode: { type: "string", multiple: true },
      strict: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    },
    allowPositionals: true
  });
  if (parsed.values.help) usage(0);
  const [source, output] = parsed.positionals;
  if (!source || !output) usage(1);
  const dryRun = Boolean(parsed.values["dry-run"]);

  await runWithSource(source, async (root) => {
    const files = selectedFiles(await walkFiles(root), parseModeValues(parsed.values.mode), Boolean(parsed.values.strict));
    if (!dryRun) await mkdir(output, { recursive: true });
    for (const { file } of files) {
      if (dryRun) {
        console.log(file.relativePath);
        continue;
      }
      const target = safeJoin(output, file.relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(file.fullPath, target);
    }
    console.error(`${dryRun ? "matched" : "copied"} ${files.length} files${dryRun ? "" : ` to ${output}`}`);
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") usage(0);
  if (!existsSync("tools/osu-skin-extract.ts")) process.chdir(path.dirname(Bun.main));
  if (command === "summary") return commandSummary(args);
  if (command === "list") return commandList(args);
  if (command === "extract") return commandExtract(args);
  throw new Error(`unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
