import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

import {
  modeIds,
  scopeIds,
  taxonomyRegistry,
  type Mode,
  type ScopeId,
} from "./domain/taxonomy";
import {
  isLazerMeaningful,
  SkinAssetSource,
  SkinMeaning,
  toLegacyClassificationView,
  type RequiredLevel,
  type SkinKind,
} from "./domain/skin-asset";
import {
  classificationRules as domainClassificationRules,
  type ClassificationRule,
} from "./classification/classification-rules";
import {
  classifySkinAsset,
  matchingRuleFor,
} from "./classification/skin-classifier";
import {
  canonicalKey,
  kindFor,
  logicalSkinKey,
  normalizeSeparators,
  toPosixPath,
  stripScaleSuffix,
  nameMatches,
  globToRegExp,
  matchesMode,
  modesFor,
} from "./classification/filename-normalizer";
import {
  emptySkinContext,
  parseSkinIniContext,
  skinContextForRoot,
  type SkinClassificationContext,
} from "./classification/skin-ini-context";
import { TaxonomyPathSnapshot, TaxonomyPath } from "./domain/taxonomy-path";

export {
  canonicalKey,
  emptySkinContext,
  globToRegExp,
  kindFor,
  logicalSkinKey,
  matchesMode,
  modesFor,
  nameMatches,
  normalizeSeparators,
  parseSkinIniContext,
  skinContextForRoot,
  stripScaleSuffix,
  toPosixPath,
};

export type {
  Mode,
  RequiredLevel,
  SkinClassificationContext,
  SkinKind,
};

export const modes = modeIds;
export const scopes = scopeIds;

export type Scope = ScopeId;
export type LazerMeaning = true | false;

export type SkinClassification = {
  ruleId: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  scope: Scope | string;
  category: string;
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
  modes: Mode[];
  kind: SkinKind;
  lazerMeaningful: LazerMeaning;
  taxonomy?: TaxonomyPathSnapshot;
  taxonomyPath?: TaxonomyPath;
  meaning?: SkinMeaning;
  source?: SkinAssetSource;
};

export type SkinFile = SkinClassification & {
  root: string;
  relativePath: string;
  fullPath: string;
};

export type Rule = {
  id?: string;
  scope: Scope | string;
  category: string;
  label: string;
  patterns: string[];
  lazerMeaningful: LazerMeaning;
  componentId?: string;
  requiredLevel?: RequiredLevel;
};

export const alwaysKeep = new Set(["skin.ini"]);

function compatRuleFromDomain(rule: ClassificationRule): Rule {
  const taxonomyPath = taxonomyRegistry.resolvePath(rule.path);
  const lazerMeaningful = isLazerMeaningful(rule.meaning);

  return {
    id: rule.id,
    scope: taxonomyPath.scope.id,
    category: taxonomyPath.category.id,
    label: taxonomyPath.group.label,
    patterns: [...rule.patterns],
    lazerMeaningful,
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
  };
}

/**
 * Backward-compatible rule list for existing matrix / placeholder row code.
 *
 * New code should import from:
 *   ./classification/classification-rules
 */
export const classificationRules: Rule[] = domainClassificationRules.map(compatRuleFromDomain);

export function classificationRuleId(
  rule: Rule,
  index = classificationRules.indexOf(rule),
): string {
  return rule.id ?? `${rule.scope}:${rule.category}:${index}`;
}

export function classifySkinFile(
  relativePath: string,
  context?: SkinClassificationContext,
): SkinClassification {
  const asset = classifySkinAsset({ relativePath, context });
  const legacy = toLegacyClassificationView(asset);

  return {
    ...legacy,
    taxonomy: asset.taxonomy,
    taxonomyPath: asset.taxonomyPath,
    meaning: asset.meaning,
    source: asset.source,
  };
}

export function categoryFor(relativePath: string): string {
  return classifySkinFile(relativePath).scope;
}

export function structuredPathFor(
  relativePath: string,
  context?: SkinClassificationContext,
): string {
  const classification = classifySkinFile(relativePath, context);
  return [
    classification.scope,
    classification.category,
    classification.groupKey,
    toPosixPath(relativePath),
  ].join("/");
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

  if (
    target !== resolvedRoot &&
    !target.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(`path escapes root: ${relativePath}`);
  }

  return target;
}

export async function walkFiles(root: string): Promise<SkinFile[]> {
  const files: SkinFile[] = [];
  const context = await skinContextForRoot(root);

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativePath = normalizeSeparators(path.relative(root, fullPath));
      const asset = classifySkinAsset({
        root,
        relativePath,
        fullPath,
        context,
      });
      const legacy = toLegacyClassificationView(asset);

      files.push({
        root,
        relativePath,
        fullPath,
        ...legacy,
        taxonomy: asset.taxonomy,
        taxonomyPath: asset.taxonomyPath,
        meaning: asset.meaning,
        source: asset.source,
      });
    }
  }

  await walk(root);

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function extractArchive(
  source: string,
  output: string,
): Promise<void> {
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

export async function resolveSource(
  source: string,
  tempRoot: string,
): Promise<string> {
  const sourceStat = await stat(source).catch(() => null);

  if (!sourceStat) {
    throw new Error(`source does not exist: ${source}`);
  }

  if (sourceStat.isDirectory()) return source;

  if (sourceStat.isFile() && source.toLowerCase().endsWith(".osk")) {
    const output = path.join(
      tempRoot,
      path.basename(source, path.extname(source)),
    );

    await extractArchive(source, output);
    return output;
  }

  throw new Error(
    `source must be an extracted skin folder or .osk file: ${source}`,
  );
}

export async function copyTreeStructured(
  sourceRoot: string,
  outputRoot: string,
): Promise<Record<string, string>> {
  const manifest: Record<string, string> = {};
  const context = await skinContextForRoot(sourceRoot);

  for (const file of await walkFiles(sourceRoot)) {
    const structuredPath = structuredPathFor(file.relativePath, context);
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

/**
 * Compatibility helper for older callers that expect rule lookup behavior.
 * New code should call classifySkinAsset() and inspect source.kind/source.ruleId.
 */
export function ruleFor(relativePath: string): Rule | null {
  const rule = matchingRuleFor(relativePath);
  return rule ? compatRuleFromDomain(rule) : null;
}

/**
 * Direct access to the new classifier for gradual migration.
 */
export { classifySkinAsset };