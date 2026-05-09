import { classificationRules } from "../classification/classification-rules";
import { buildAssetMatrix, type AssetMatrix, type AssetMatrixRowSeed } from "./asset-matrix-builder";

export function rowSeedsFromClassificationRules(): AssetMatrixRowSeed[] {
  return classificationRules.map((rule) => ({
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    taxonomyPath: rule.path,
    groupKey: rule.path.groupId,
    kind: rule.kind,
    meaning: rule.meaning,
  }));
}

export function createEmptyAssetMatrix(): AssetMatrix {
  return buildAssetMatrix({
    project: [],
    sources: [],
    rowSeeds: rowSeedsFromClassificationRules(),
  });
}
