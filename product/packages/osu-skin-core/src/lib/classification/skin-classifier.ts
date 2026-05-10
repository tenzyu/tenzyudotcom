import type { Mode, TaxonomyPathInput } from "../domain/taxonomy";
import { TaxonomyPath } from "../domain/taxonomy-path";
import {
  createSkinFileRef,
  isLazerMeaningful,
  meaningForUnknown,
  toLegacyClassificationView,
  type ClassifiedSkinAsset,
  type LegacySkinClassificationView,
  type RequiredLevel,
  type SkinKind,
  type SkinMeaning,
} from "../domain/skin-asset";
import {
  classificationRules,
  type ClassificationRule,
} from "./classification-rules";
import {
  canonicalKey,
  kindFor,
  logicalSkinKey,
  matchesMode,
  modesFor,
  nameMatches,
  sequenceInfo,
} from "./filename-normalizer";
import {
  contextClassificationFor,
  isContextMeaningful,
  type ContextualClassification,
  type SkinClassificationContext,
} from "./skin-ini-context";

export type SkinClassifierInput = {
  root?: string;
  relativePath: string;
  fullPath?: string;
  context?: SkinClassificationContext;
};

export type SkinClassificationCompat = LegacySkinClassificationView & {
  taxonomy: ClassifiedSkinAsset["taxonomy"];
  taxonomyPath: ClassifiedSkinAsset["taxonomyPath"];
  meaning: SkinMeaning;
  source: ClassifiedSkinAsset["source"];
};

function ruleMatches(relativePath: string, rule: ClassificationRule): boolean {
  return nameMatches(relativePath, rule.patterns, { logical: true });
}

function modesForRule(relativePath: string, rule: ClassificationRule): Mode[] {
  if (rule.modes.length > 0) return [...rule.modes];

  return modesFor(relativePath);
}

function resolveRuleGroup(
  relativePath: string,
  rule: ClassificationRule,
): TaxonomyPathInput {
  const family = sequenceInfo(relativePath);
  const strategy = rule.groupStrategy ?? "fixed";

  if (strategy === "filename-stem") {
    return {
      ...rule.path,
      groupId: family.familyKey,
      groupLabel: family.familyLabel,
    };
  }

  if (strategy === "animation-family") {
    return {
      ...rule.path,
      groupId: family.familyKey,
      groupLabel: family.familyLabel,
    };
  }

  return rule.path;
}

function assetFromRule(input: SkinClassifierInput, rule: ClassificationRule): ClassifiedSkinAsset {
  const file = createSkinFileRef({
    root: input.root ?? "",
    relativePath: input.relativePath,
    fullPath: input.fullPath ?? input.relativePath,
  });

  const family = sequenceInfo(input.relativePath);
  const taxonomyPath = TaxonomyPath.from(resolveRuleGroup(input.relativePath, rule));

  return {
    file,
    taxonomyPath,
    taxonomy: taxonomyPath.toJSON(),
    ruleId: rule.id,
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    groupKey: taxonomyPath.group.id,
    sequenceIndex: family.sequenceIndex,
    modes: modesForRule(input.relativePath, rule),
    kind: rule.kind ?? kindFor(input.relativePath),
    meaning: rule.meaning,
    source: {
      kind: "rule",
      ruleId: rule.id,
    },
  };
}

function assetFromContext(
  input: SkinClassifierInput,
  contextual: ContextualClassification,
): ClassifiedSkinAsset {
  const file = createSkinFileRef({
    root: input.root ?? "",
    relativePath: input.relativePath,
    fullPath: input.fullPath ?? input.relativePath,
  });

  const family = sequenceInfo(input.relativePath);
  const taxonomyPath = TaxonomyPath.from(contextual.path);

  return {
    file,
    taxonomyPath,
    taxonomy: taxonomyPath.toJSON(),
    ruleId: contextual.ruleId,
    componentId: contextual.componentId,
    requiredLevel: contextual.requiredLevel,
    groupKey: taxonomyPath.group.id,
    sequenceIndex: family.sequenceIndex,
    modes: contextual.modes.length > 0 ? contextual.modes : modesFor(input.relativePath),
    kind: contextual.kind ?? kindFor(input.relativePath),
    meaning: contextual.meaning,
    source: {
      kind: "skin-ini",
      ruleId: contextual.ruleId,
      reason: contextual.reason,
    },
  };
}

function fallbackPathFor(kind: SkinKind, relativePath: string): TaxonomyPathInput {
  const family = sequenceInfo(relativePath);

  switch (kind) {
    case "image":
      return {
        scopeId: "extras",
        categoryId: "image-files",
        groupId: family.familyKey || "image-files",
        groupLabel: family.familyLabel,
      };

    case "audio":
      return {
        scopeId: "extras",
        categoryId: "audio-files",
        groupId: family.familyKey || "audio-files",
        groupLabel: family.familyLabel,
      };

    case "text":
      return {
        scopeId: "extras",
        categoryId: "text-files",
        groupId: family.familyKey || "text-files",
        groupLabel: family.familyLabel,
      };

    case "font":
      return {
        scopeId: "extras",
        categoryId: "font-files",
        groupId: "font-files",
      };

    default:
      return {
        scopeId: "extras",
        categoryId: "other-files",
        groupId: family.familyKey || "other-files",
        groupLabel: family.familyLabel,
      };
  }
}

function fallbackAsset(input: SkinClassifierInput): ClassifiedSkinAsset {
  const file = createSkinFileRef({
    root: input.root ?? "",
    relativePath: input.relativePath,
    fullPath: input.fullPath ?? input.relativePath,
  });

  const kind = kindFor(input.relativePath);
  const family = sequenceInfo(input.relativePath);
  const taxonomyPath = TaxonomyPath.from(fallbackPathFor(kind, input.relativePath));

  return {
    file,
    taxonomyPath,
    taxonomy: taxonomyPath.toJSON(),
    ruleId: `extras:${kind}`,
    componentId: "extras",
    requiredLevel: "optional",
    groupKey: taxonomyPath.group.id,
    sequenceIndex: family.sequenceIndex,
    modes: modesFor(input.relativePath),
    kind,
    meaning: meaningForUnknown(),
    source: {
      kind: "fallback",
      reason: "No classification rule matched.",
    },
  };
}

function weakContextFallback(input: SkinClassifierInput): ClassifiedSkinAsset | null {
  if (!isContextMeaningful(input.relativePath, input.context)) return null;

  const file = createSkinFileRef({
    root: input.root ?? "",
    relativePath: input.relativePath,
    fullPath: input.fullPath ?? input.relativePath,
  });

  const family = sequenceInfo(input.relativePath);
  const logical = logicalSkinKey(input.relativePath);
  const basename = logical.split("/").at(-1) ?? logical;

  const looksLikeMania = basename.startsWith("mania-") || /^(note|key|stage|light|mania)/.test(basename);
  const path: TaxonomyPathInput = looksLikeMania
    ? {
        scopeId: "mania",
        categoryId: "skin-ini-references",
        groupId: "custom-assets",
      }
    : {
        scopeId: "configs",
        categoryId: "skin-ini-references",
        groupId: "skin-ini-references",
      };

  const taxonomyPath = TaxonomyPath.from(path);

  return {
    file,
    taxonomyPath,
    taxonomy: taxonomyPath.toJSON(),
    ruleId: looksLikeMania
      ? "skin-ini:mania:custom-assets"
      : "skin-ini:configs:references",
    componentId: looksLikeMania
      ? "mania.custom.assets"
      : "config.skin-ini.references",
    requiredLevel: "recommended",
    groupKey: taxonomyPath.group.id,
    sequenceIndex: family.sequenceIndex,
    modes: looksLikeMania ? ["mania"] : modesFor(input.relativePath),
    kind: kindFor(input.relativePath),
    meaning: {
      lazerLegacy: true,
      lazerNative: false,
      stable: true,
    },
    source: {
      kind: "skin-ini",
      reason: "Matched skin.ini context meaningful key.",
    },
  };
}

export function matchingRuleFor(relativePath: string): ClassificationRule | null {
  const key = canonicalKey(relativePath);

  for (const rule of classificationRules) {
    if (ruleMatches(key, rule)) return rule;
  }

  return null;
}

export function classifySkinAsset(input: SkinClassifierInput): ClassifiedSkinAsset {
  const contextual = contextClassificationFor(input.relativePath, input.context);
  if (contextual) return assetFromContext(input, contextual);

  const weakContextual = weakContextFallback(input);
  if (weakContextual) return weakContextual;

  const rule = matchingRuleFor(input.relativePath);
  if (rule) return assetFromRule(input, rule);

  return fallbackAsset(input);
}

export function classifySkinFile(
  relativePath: string,
  context?: SkinClassificationContext,
): SkinClassificationCompat {
  const asset = classifySkinAsset({ relativePath, context });

  return {
    ...toLegacyClassificationView(asset),
    taxonomy: asset.taxonomy,
    taxonomyPath: asset.taxonomyPath,
    meaning: asset.meaning,
    source: asset.source,
  };
}

export function classifySkinFiles(
  files: Array<Pick<SkinClassifierInput, "root" | "relativePath" | "fullPath">>,
  context?: SkinClassificationContext,
): ClassifiedSkinAsset[] {
  return files.map((file) => classifySkinAsset({ ...file, context }));
}

export function selectedByModes(
  asset: ClassifiedSkinAsset,
  selectedModes: readonly Mode[],
  options: { strict?: boolean; alwaysKeep?: readonly string[] } = {},
): boolean {
  const alwaysKeep = new Set((options.alwaysKeep ?? ["skin.ini"]).map((value) => value.toLowerCase()));
  if (alwaysKeep.has(asset.file.relativePath.toLowerCase())) return true;

  if (selectedModes.length === 0) return true;

  const requested = new Set(selectedModes);
  const hasRequestedMode = asset.modes.some((mode) => requested.has(mode));

  if (!options.strict) return hasRequestedMode;
  return hasRequestedMode && asset.modes.every((mode) => requested.has(mode));
}

export function matchesModeForFile(relativePath: string, mode: Mode): boolean {
  return matchesMode(relativePath, mode);
}

export function lazerMeaningfulForFile(
  relativePath: string,
  context?: SkinClassificationContext,
): boolean {
  return isLazerMeaningful(classifySkinAsset({ relativePath, context }).meaning);
}

export function requiredLevelForFile(
  relativePath: string,
  context?: SkinClassificationContext,
): RequiredLevel {
  return classifySkinAsset({ relativePath, context }).requiredLevel;
}
