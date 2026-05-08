import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

export const modes = ["osu", "taiko", "catch", "mania"] as const;
export type Mode = (typeof modes)[number];

export const scopes = [
  "std",
  "mania",
  "catch",
  "taiko",
  "interface",
  "fonts",
  "configs",
  "sounds",
  "stable",
  "extras"
] as const;
export type Scope = (typeof scopes)[number];

export type SkinKind = "image" | "audio" | "text" | "font" | "other";

export type SkinClassification = {
  scope: Scope;
  category: string;
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
  modes: Mode[];
  kind: SkinKind;
};

export type SkinFile = SkinClassification & {
  root: string;
  relativePath: string;
  fullPath: string;
};

export const alwaysKeep = new Set(["skin.ini"]);

const imageExts = new Set([".png", ".jpg", ".jpeg"]);
const audioExts = new Set([".wav", ".ogg", ".mp3"]);
const textExts = new Set([".ini", ".json", ".txt"]);
const fontExts = new Set([".ttf", ".otf", ".fnt"]);

const modePatterns: Record<Mode, string[]> = {
  osu: [
    "approachcircle*",
    "comboburst*",
    "default-*",
    "followpoint*",
    "hit0*",
    "hit50*",
    "hit100*",
    "hit300*",
    "hitcircle*",
    "hitcircleoverlay*",
    "lighting*",
    "reversearrow*",
    "slider*",
    "sliderscorepoint*",
    "sliderb*",
    "spinner-*",
    "spinner_*",
    "spinnerspin*",
    "cursor*",
    "cursors/*"
  ],
  taiko: [
    "approachcircle*",
    "drum-*",
    "lighting*",
    "pippidon*",
    "taiko-*",
    "taikobigcircle*",
    "taikohitcircle*",
    "taiko/*"
  ],
  catch: ["comboburst-fruits*", "fruit-*", "lighting*"],
  mania: ["comboburst-mania*", "lightingg*", "lightingl*", "lightingn*", "mania-*"]
};

type Rule = {
  scope: Scope;
  category: string;
  label: string;
  patterns: string[];
};

const classificationRules: Rule[] = [
  { scope: "configs", category: "skin-ini", label: "skin.ini", patterns: ["skin.ini"] },
  { scope: "configs", category: "lazer-layouts", label: "lazer layout JSON", patterns: ["*.json"] },

  { scope: "fonts", category: "font-files", label: "font files", patterns: ["*.ttf", "*.otf", "*.fnt"] },

  { scope: "mania", category: "hit-bursts", label: "hit bursts", patterns: ["mania-hit0*", "mania-hit50*", "mania-hit100*", "mania-hit200*", "mania-hit300*", "mania-hit300g*"] },
  { scope: "mania", category: "comboburst", label: "comboburst", patterns: ["comboburst-mania*"] },
  { scope: "mania", category: "keys", label: "keys", patterns: ["mania-key*"] },
  { scope: "mania", category: "notes", label: "notes", patterns: ["mania-note*"] },
  { scope: "mania", category: "stage", label: "stage", patterns: ["mania-stage*", "mania-warningarrow*"] },
  { scope: "mania", category: "lighting", label: "lighting", patterns: ["lightingg*", "lightingl*", "lightingn*"] },

  { scope: "taiko", category: "pippidon", label: "pippidon", patterns: ["pippidon*"] },
  { scope: "taiko", category: "hit-bursts", label: "hit bursts", patterns: ["taiko-hit*", "taiko-normal-hit*", "taiko-soft-hit*"] },
  { scope: "taiko", category: "notes", label: "notes", patterns: ["taikohitcircle*", "taikobigcircle*"] },
  { scope: "taiko", category: "playfield-upper", label: "playfield upper", patterns: ["taiko-slider*", "taiko-flower-group*"] },
  { scope: "taiko", category: "playfield-lower", label: "playfield lower", patterns: ["taiko-bar*", "taiko-drum-inner*", "taiko-drum-outer*"] },
  { scope: "taiko", category: "drumrolls", label: "drumrolls", patterns: ["taiko-roll-*", "drum-slider*"] },
  { scope: "taiko", category: "shaker", label: "shaker", patterns: ["spinner-warning*", "spinner-circle*", "spinner-approachcircle*"] },
  { scope: "taiko", category: "sounds", label: "sounds", patterns: ["drum-hit*"] },

  { scope: "catch", category: "catcher", label: "catcher", patterns: ["fruit-catcher-*"] },
  { scope: "catch", category: "comboburst", label: "comboburst", patterns: ["comboburst-fruits*"] },
  { scope: "catch", category: "fruits", label: "fruits", patterns: ["fruit-*"] },

  { scope: "std", category: "cursor", label: "cursor", patterns: ["cursor*", "cursors/*"] },
  { scope: "std", category: "comboburst", label: "comboburst", patterns: ["comboburst*"] },
  { scope: "std", category: "default-numbers", label: "default numbers", patterns: ["default-*"] },
  { scope: "std", category: "hit-circles", label: "hit circles", patterns: ["approachcircle*", "hitcircle*", "hitcircleoverlay*", "hitcircleselect*", "followpoint*"] },
  { scope: "std", category: "slider", label: "slider", patterns: ["sliderstartcircle*", "sliderendcircle*", "sliderfollowcircle*", "sliderb*", "sliderscorepoint*", "reversearrow*", "sliderpoint*"] },
  { scope: "std", category: "spinner", label: "spinner", patterns: ["spinner-*", "spinner_*", "spinnerspin*", "spinnerbonus*"] },
  { scope: "std", category: "particles", label: "particles", patterns: ["lighting*"] },
  { scope: "std", category: "slider-miss-indicators", label: "slider miss indicators", patterns: ["sliderendmiss*", "slidertickmiss*"] },
  { scope: "std", category: "hit-bursts", label: "hit bursts", patterns: ["hit0*", "hit50*", "hit100*", "hit300*"] },

  { scope: "interface", category: "hud", label: "hud", patterns: ["score-*", "scorebar-*", "combo-*", "inputoverlay-*", "play-*", "ready*", "count*", "section*"] },
  { scope: "interface", category: "menu", label: "menu", patterns: ["menu-*", "button-*", "selection-*", "mode-*", "star*", "welcome*", "check-*", "click-*"] },
  { scope: "interface", category: "sounds", label: "interface sounds", patterns: ["applause*", "combobreak*", "failsound*", "gos*", "seeya*", "welcome*", "menuclick*", "menuback*", "menuhit*", "key-*", "match-*", "nightcore-*", "normal-*", "soft-*"] },

  { scope: "sounds", category: "hitsounds", label: "hitsounds", patterns: ["normal-*", "soft-*", "drum-*", "taiko-*-hit*"] },

  { scope: "stable", category: "ranking", label: "ranking", patterns: ["ranking-*", "scoreentry-*"] },
  { scope: "stable", category: "pause", label: "pause", patterns: ["pause-*", "fail-background*"] },
  { scope: "stable", category: "songselect", label: "songselect", patterns: ["songselect-*"] },
  { scope: "stable", category: "selection", label: "selection", patterns: ["selection-*", "mode-*-small*", "mode-*-med*", "mode-osu*", "mode-taiko*", "mode-fruits*", "mode-mania*"] },
  { scope: "stable", category: "legacy-editor", label: "legacy editor", patterns: ["hitcircleselect*"] },
  { scope: "stable", category: "extras", label: "stable extras", patterns: ["arrow-*", "play-skip*", "play-unranked*"] }
];

export function normalizeSeparators(value: string): string {
  return value.split(path.sep).join("/");
}

export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

export function stripScaleSuffix(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  return `${stem.endsWith("@2x") ? stem.slice(0, -3) : stem}${ext}`;
}

export function canonicalKey(relativePath: string): string {
  const parts = toPosixPath(relativePath).toLowerCase().split("/");
  parts[parts.length - 1] = stripScaleSuffix(parts[parts.length - 1]);
  return parts.join("/");
}

export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`);
}

function nameMatches(relativePath: string, patterns: string[]): boolean {
  const key = canonicalKey(relativePath);
  const basename = key.split("/").at(-1) ?? key;
  return patterns.some((pattern) => {
    const lower = pattern.toLowerCase();
    return globToRegExp(lower).test(lower.includes("/") ? key : basename);
  });
}

export function matchesMode(relativePath: string, mode: Mode): boolean {
  return nameMatches(relativePath, modePatterns[mode]);
}

export function modesFor(relativePath: string): Mode[] {
  return modes.filter((mode) => matchesMode(relativePath, mode));
}

export function kindFor(relativePath: string): SkinKind {
  const ext = path.extname(relativePath).toLowerCase();
  if (imageExts.has(ext)) return "image";
  if (audioExts.has(ext)) return "audio";
  if (textExts.has(ext)) return "text";
  if (fontExts.has(ext)) return "font";
  return "other";
}

function titleize(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function sequenceInfo(relativePath: string): { groupKey: string; sequenceIndex: number | null } {
  const parsed = path.parse(toPosixPath(relativePath));
  let stem = stripScaleSuffix(parsed.name);
  const sequence = stem.match(/^(.*?)-(\d+)$/);
  if (sequence) {
    stem = sequence[1];
    return { groupKey: stem.toLowerCase(), sequenceIndex: Number(sequence[2]) };
  }
  return { groupKey: stem.toLowerCase(), sequenceIndex: null };
}

function fallbackGroup(relativePath: string): { groupKey: string; groupLabel: string; sequenceIndex: number | null } {
  const { groupKey, sequenceIndex } = sequenceInfo(relativePath);
  return { groupKey, groupLabel: titleize(groupKey), sequenceIndex };
}

export function classifySkinFile(relativePath: string): SkinClassification {
  const key = canonicalKey(relativePath);
  const kind = kindFor(relativePath);
  const fileModes = modesFor(key);
  const group = fallbackGroup(key);

  for (const rule of classificationRules) {
    if (!nameMatches(key, rule.patterns)) continue;
    return {
      scope: rule.scope,
      category: rule.category,
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      sequenceIndex: group.sequenceIndex,
      modes: fileModes,
      kind
    };
  }

  return {
    scope: "extras",
    category: kind === "other" ? "other-files" : `${kind}-files`,
    groupKey: group.groupKey,
    groupLabel: group.groupLabel,
    sequenceIndex: group.sequenceIndex,
    modes: fileModes,
    kind
  };
}

export function categoryFor(relativePath: string): string {
  return classifySkinFile(relativePath).scope;
}

export function structuredPathFor(relativePath: string): string {
  const classification = classifySkinFile(relativePath);
  return `${classification.scope}/${classification.category}/${classification.groupKey}/${toPosixPath(relativePath)}`;
}

export function flatPathFromStructured(structuredPath: string): string {
  const parts = toPosixPath(structuredPath).split("/");
  if (scopes.includes(parts[0] as Scope) && parts.length >= 4) {
    return parts.slice(3).join("/");
  }
  if (scopes.includes(parts[0] as Scope)) {
    return parts.slice(1).join("/");
  }
  return toPosixPath(structuredPath);
}

export function safeJoin(root: string, relativePath: string): string {
  const normalized = toPosixPath(relativePath);
  if (path.isAbsolute(relativePath) || normalized.split("/").includes("..")) {
    throw new Error(`unsafe path: ${relativePath}`);
  }
  const target = path.resolve(root, normalized);
  const resolvedRoot = path.resolve(root);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`path escapes root: ${relativePath}`);
  }
  return target;
}

export async function walkFiles(root: string): Promise<SkinFile[]> {
  const files: SkinFile[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = normalizeSeparators(path.relative(root, fullPath));
      files.push({
        root,
        relativePath,
        fullPath,
        ...classifySkinFile(relativePath)
      });
    }
  }

  await walk(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function extractArchive(source: string, output: string): Promise<void> {
  await mkdir(output, { recursive: true });
  const listing = await $`unzip -Z1 ${source}`.quiet().text();
  for (const member of listing.split("\n").filter(Boolean)) {
    const normalized = toPosixPath(member);
    if (path.isAbsolute(member) || normalized.split("/").includes("..")) {
      throw new Error(`refusing unsafe archive member: ${member}`);
    }
  }
  await $`unzip -qq ${source} -d ${output}`.quiet();
}

export async function resolveSource(source: string, tempRoot: string): Promise<string> {
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat) throw new Error(`source does not exist: ${source}`);
  if (sourceStat.isDirectory()) return source;
  if (sourceStat.isFile() && source.toLowerCase().endsWith(".osk")) {
    const output = path.join(tempRoot, path.basename(source, path.extname(source)));
    await extractArchive(source, output);
    return output;
  }
  throw new Error(`source must be an extracted skin folder or .osk file: ${source}`);
}

export async function copyTreeStructured(sourceRoot: string, outputRoot: string): Promise<Record<string, string>> {
  const manifest: Record<string, string> = {};
  for (const file of await walkFiles(sourceRoot)) {
    const structuredPath = structuredPathFor(file.relativePath);
    const target = safeJoin(outputRoot, structuredPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(file.fullPath, target);
    manifest[structuredPath] = file.relativePath;
  }
  return manifest;
}

export async function emptyDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}
