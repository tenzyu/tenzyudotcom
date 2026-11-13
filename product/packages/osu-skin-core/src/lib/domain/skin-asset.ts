import type { Mode, ScopeId } from "./taxonomy";
import type { TaxonomyPath, TaxonomyPathSnapshot } from "./taxonomy-path";

export const skinKinds = ["image", "audio", "text", "font", "other"] as const;
export type SkinKind = (typeof skinKinds)[number];

export const requiredLevels = ["required", "recommended", "optional"] as const;
export type RequiredLevel = (typeof requiredLevels)[number];

export type SkinMeaning = {
  /**
   * True when the asset is meaningful through stable-compatible legacy skinning in lazer.
   * Example: hitcircle.png, cursor.png, scorebar-bg.png, mania-note1.png.
   */
  lazerLegacy: boolean;

  /**
   * True when the asset is meaningful through lazer-native layout/component skinning.
   * Example: MainHUDComponents.json.
   */
  lazerNative: boolean;

  /**
   * True when the asset is meaningful in osu!stable, even if not meaningful in lazer.
   * Example: ranking-panel.png, selection-mod-hidden.png.
   */
  stable: boolean;
};

export type SkinAssetSourceKind =
  | "rule"
  | "skin-ini"
  | "fallback"
  | "manual";

export type SkinAssetSource = {
  kind: SkinAssetSourceKind;
  ruleId?: string;
  reason?: string;
};

export type SkinFileRef = {
  root: string;
  relativePath: string;
  fullPath: string;
  name: string;
  extension: string;
};

export type SkinAssetIdentity = {
  /**
   * Stable semantic component key.
   * Prefer dotted IDs over filesystem IDs.
   * Example: osu.cursor, osu.slider.miss-indicators, mania.notes.
   */
  componentId: string;

  /**
   * Rule ID that classified this asset.
   * Should be stable across refactors.
   */
  ruleId: string;
};

export type SkinAssetSequence = {
  /**
   * Group key for animation or logical family.
   * Example: followpoint, sliderb, score.
   */
  groupKey: string;

  /**
   * Sequence index if file is an animation frame.
   * Example: followpoint-2.png -> 2.
   */
  sequenceIndex: number | null;
};

export type ClassifiedSkinAsset = SkinAssetIdentity &
  SkinAssetSequence & {
    file: SkinFileRef;
    taxonomyPath: TaxonomyPath;
    taxonomy: TaxonomyPathSnapshot;
    requiredLevel: RequiredLevel;
    modes: Mode[];
    kind: SkinKind;
    meaning: SkinMeaning;
    source: SkinAssetSource;
  };

export type LegacySkinClassificationView = {
  ruleId: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  scope: ScopeId | string;
  category: string;
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
  modes: Mode[];
  kind: SkinKind;
  lazerMeaningful: boolean;
};

export function isLazerMeaningful(meaning: SkinMeaning): boolean {
  return meaning.lazerLegacy || meaning.lazerNative;
}

export function isStableOnly(meaning: SkinMeaning): boolean {
  return meaning.stable && !isLazerMeaningful(meaning);
}

export function meaningForLazerLegacy(stable = true): SkinMeaning {
  return {
    lazerLegacy: true,
    lazerNative: false,
    stable,
  };
}

export function meaningForLazerNative(stable = false): SkinMeaning {
  return {
    lazerLegacy: false,
    lazerNative: true,
    stable,
  };
}

export function meaningForStableOnly(): SkinMeaning {
  return {
    lazerLegacy: false,
    lazerNative: false,
    stable: true,
  };
}

export function meaningForUnknown(): SkinMeaning {
  return {
    lazerLegacy: false,
    lazerNative: false,
    stable: false,
  };
}

export function toLegacyClassificationView(asset: ClassifiedSkinAsset): LegacySkinClassificationView {
  return {
    ruleId: asset.ruleId,
    componentId: asset.componentId,
    requiredLevel: asset.requiredLevel,
    scope: asset.taxonomyPath.scope.id,
    category: asset.taxonomyPath.category.id,
    groupKey: asset.groupKey,
    groupLabel: asset.taxonomyPath.group.label,
    sequenceIndex: asset.sequenceIndex,
    modes: asset.modes,
    kind: asset.kind,
    lazerMeaningful: isLazerMeaningful(asset.meaning),
  };
}

export function compareSkinAssets(a: ClassifiedSkinAsset, b: ClassifiedSkinAsset): number {
  return (
    a.taxonomyPath.scope.order - b.taxonomyPath.scope.order ||
    a.taxonomyPath.category.order - b.taxonomyPath.category.order ||
    a.taxonomyPath.group.order - b.taxonomyPath.group.order ||
    (a.sequenceIndex ?? Number.MAX_SAFE_INTEGER) - (b.sequenceIndex ?? Number.MAX_SAFE_INTEGER) ||
    a.file.relativePath.localeCompare(b.file.relativePath)
  );
}

export function createSkinFileRef(input: {
  root: string;
  relativePath: string;
  fullPath: string;
}): SkinFileRef {
  const normalizedRelativePath = input.relativePath.replaceAll("\\", "/");
  const name = normalizedRelativePath.split("/").at(-1) ?? normalizedRelativePath;
  const extensionMatch = name.match(/(\.[^.]+)$/);

  return {
    root: input.root,
    relativePath: normalizedRelativePath,
    fullPath: input.fullPath,
    name,
    extension: extensionMatch?.[1]?.toLowerCase() ?? "",
  };
}
