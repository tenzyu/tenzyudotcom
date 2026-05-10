import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Mode, TaxonomyPathInput } from "../domain/taxonomy";
import {
  meaningForLazerLegacy,
  type RequiredLevel,
  type SkinKind,
  type SkinMeaning,
} from "../domain/skin-asset";
import {
  canonicalKey,
  kindFor,
  logicalSkinKey,
  toPosixPath,
} from "./filename-normalizer";

export type ContextualClassification = {
  ruleId: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  path: TaxonomyPathInput;
  modes: Mode[];
  kind?: SkinKind;
  meaning: SkinMeaning;
  reason: string;
};

export type SkinClassificationContext = {
  meaningfulKeys: Set<string>;
  fontPrefixes: Set<string>;
  referencedClassifications: Map<string, ContextualClassification>;
};

export function emptySkinContext(): SkinClassificationContext {
  return {
    meaningfulKeys: new Set(),
    fontPrefixes: new Set(),
    referencedClassifications: new Map(),
  };
}

const fontGlyphs = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "comma",
  "dot",
  "percent",
  "x",
  "pp",
] as const;

function cleanValue(rawValue: string): string {
  return rawValue
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(/[;,]/)[0]
    ?.trim() ?? "";
}

function isNonAssetValue(value: string): boolean {
  if (!value) return true;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return true;
  if (/^(true|false)$/i.test(value)) return true;
  if (/^\d+\s*,/.test(value)) return true;
  if (/\s/.test(value)) return true;
  return false;
}

function candidateAssetPaths(rawValue: string): string[] {
  const value = cleanValue(rawValue);
  if (isNonAssetValue(value)) return [];

  const normalized = toPosixPath(value);
  const ext = path.extname(normalized).toLowerCase();

  if (ext) return [normalized];

  return [
    `${normalized}.png`,
    `${normalized}.jpg`,
    `${normalized}.jpeg`,
    `${normalized}.wav`,
    `${normalized}.ogg`,
    `${normalized}.mp3`,
  ];
}

function addMeaningfulKey(
  context: SkinClassificationContext,
  assetPath: string,
  classification?: ContextualClassification,
): void {
  const canonical = canonicalKey(assetPath);
  const logical = logicalSkinKey(assetPath);
  const canonicalBase = canonical.split("/").at(-1) ?? canonical;
  const logicalBase = logical.split("/").at(-1) ?? logical;

  for (const key of [canonical, logical, canonicalBase, logicalBase]) {
    context.meaningfulKeys.add(key);
    if (classification) {
      context.referencedClassifications.set(key, {
        ...classification,
        kind: classification.kind ?? kindFor(key),
      });
    }
  }
}

function addReferencedAsset(
  context: SkinClassificationContext,
  rawValue: string,
  classification: ContextualClassification,
): void {
  for (const candidate of candidateAssetPaths(rawValue)) {
    addMeaningfulKey(context, candidate, classification);
  }
}

function addFontPrefix(
  context: SkinClassificationContext,
  rawValue: string,
): void {
  const prefix = cleanValue(rawValue).toLowerCase();
  if (!prefix) return;

  context.fontPrefixes.add(prefix);

  for (const glyph of fontGlyphs) {
    addMeaningfulKey(context, `${prefix}-${glyph}.png`, {
      ruleId: "skin-ini:fonts:font-prefixes",
      componentId: "font.prefix",
      requiredLevel: "recommended",
      path: {
        scopeId: "fonts",
        categoryId: "skin-ini-prefixes",
        groupId: "font-prefixes",
      },
      modes: [],
      kind: "image",
      meaning: meaningForLazerLegacy(true),
      reason: `skin.ini font prefix: ${prefix}`,
    });
  }
}

function maniaReferenceClassification(key: string): ContextualClassification {
  const lower = key.toLowerCase();

  if (lower.includes("key")) {
    return {
      ruleId: "skin-ini:mania:keys",
      componentId: "mania.custom.keys",
      requiredLevel: "recommended",
      path: {
        scopeId: "mania",
        categoryId: "keys",
        groupId: "keys",
      },
      modes: ["mania"],
      kind: "image",
      meaning: meaningForLazerLegacy(true),
      reason: `skin.ini mania key reference: ${key}`,
    };
  }

  if (lower.includes("note")) {
    return {
      ruleId: "skin-ini:mania:notes",
      componentId: "mania.custom.notes",
      requiredLevel: "recommended",
      path: {
        scopeId: "mania",
        categoryId: "notes",
        groupId: "notes",
      },
      modes: ["mania"],
      kind: "image",
      meaning: meaningForLazerLegacy(true),
      reason: `skin.ini mania note reference: ${key}`,
    };
  }

  if (
    lower.includes("stage") ||
    lower.includes("barline") ||
    lower.includes("hint") ||
    lower.includes("warning")
  ) {
    return {
      ruleId: "skin-ini:mania:stage",
      componentId: "mania.custom.stage",
      requiredLevel: "recommended",
      path: {
        scopeId: "mania",
        categoryId: "stage",
        groupId: "stage",
      },
      modes: ["mania"],
      kind: "image",
      meaning: meaningForLazerLegacy(true),
      reason: `skin.ini mania stage reference: ${key}`,
    };
  }

  if (lower.includes("light")) {
    return {
      ruleId: "skin-ini:mania:lighting",
      componentId: "mania.custom.lighting",
      requiredLevel: "recommended",
      path: {
        scopeId: "mania",
        categoryId: "lighting",
        groupId: "lighting",
      },
      modes: ["mania"],
      kind: "image",
      meaning: meaningForLazerLegacy(true),
      reason: `skin.ini mania lighting reference: ${key}`,
    };
  }

  return {
    ruleId: "skin-ini:mania:custom-assets",
    componentId: "mania.custom.assets",
    requiredLevel: "recommended",
    path: {
      scopeId: "mania",
      categoryId: "skin-ini-references",
      groupId: "custom-assets",
    },
    modes: ["mania"],
    kind: "image",
    meaning: meaningForLazerLegacy(true),
    reason: `skin.ini mania reference: ${key}`,
  };
}

function genericReferenceClassification(key: string): ContextualClassification {
  return {
    ruleId: "skin-ini:configs:references",
    componentId: "config.skin-ini.references",
    requiredLevel: "recommended",
    path: {
      scopeId: "configs",
      categoryId: "skin-ini-references",
      groupId: "skin-ini-references",
    },
    modes: [],
    meaning: meaningForLazerLegacy(true),
    reason: `skin.ini reference: ${key}`,
  };
}

function shouldTreatAsAssetReference(section: string, key: string): boolean {
  if (section === "mania") return true;
  return /image|stage|note|key|light|hint|barline|warning|sprite|texture|sample|sound/i.test(key);
}

export function parseSkinIniContext(content: string): SkinClassificationContext {
  const context = emptySkinContext();
  let section = "";

  for (const rawLine of content.split(/\r?\n/)) {
    const sectionMatch = rawLine.match(/^\s*\[([^\]]+)]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toLowerCase();
      continue;
    }

    const pair = rawLine.match(/^\s*([^:#;][^:]*):\s*(.*?)\s*(?:[;#].*)?$/);
    if (!pair) continue;

    const key = pair[1].trim().toLowerCase();
    const value = pair[2].trim();

    if (key.endsWith("prefix")) {
      addFontPrefix(context, value);
    }

    if (!shouldTreatAsAssetReference(section, key)) continue;

    addReferencedAsset(
      context,
      value,
      section === "mania"
        ? maniaReferenceClassification(key)
        : genericReferenceClassification(key),
    );
  }

  return context;
}

export async function skinContextForRoot(root: string): Promise<SkinClassificationContext> {
  const content = await readFile(path.join(root, "skin.ini"), "utf8").catch(() => "");
  return content ? parseSkinIniContext(content) : emptySkinContext();
}

export function mergeSkinContexts(
  ...contexts: Array<SkinClassificationContext | undefined>
): SkinClassificationContext {
  const merged = emptySkinContext();

  for (const context of contexts) {
    if (!context) continue;

    for (const key of context.meaningfulKeys) merged.meaningfulKeys.add(key);
    for (const prefix of context.fontPrefixes) merged.fontPrefixes.add(prefix);
    for (const [key, classification] of context.referencedClassifications) {
      merged.referencedClassifications.set(key, classification);
    }
  }

  return merged;
}

export function contextClassificationFor(
  relativePath: string,
  context?: SkinClassificationContext,
): ContextualClassification | null {
  if (!context) return null;

  const canonical = canonicalKey(relativePath);
  const logical = logicalSkinKey(relativePath);
  const canonicalBase = canonical.split("/").at(-1) ?? canonical;
  const logicalBase = logical.split("/").at(-1) ?? logical;

  return (
    context.referencedClassifications.get(canonical) ??
    context.referencedClassifications.get(logical) ??
    context.referencedClassifications.get(canonicalBase) ??
    context.referencedClassifications.get(logicalBase) ??
    null
  );
}

export function isContextMeaningful(
  relativePath: string,
  context?: SkinClassificationContext,
): boolean {
  if (!context) return false;

  const canonical = canonicalKey(relativePath);
  const logical = logicalSkinKey(relativePath);
  const canonicalBase = canonical.split("/").at(-1) ?? canonical;
  const logicalBase = logical.split("/").at(-1) ?? logical;

  if (
    context.meaningfulKeys.has(canonical) ||
    context.meaningfulKeys.has(logical) ||
    context.meaningfulKeys.has(canonicalBase) ||
    context.meaningfulKeys.has(logicalBase)
  ) {
    return true;
  }

  const basename = logicalBase;
  const ext = path.extname(basename);
  if (!ext) return false;

  const stem = basename.slice(0, basename.length - ext.length);
  return [...context.fontPrefixes].some((prefix) => stem.startsWith(`${prefix}-`));
}
