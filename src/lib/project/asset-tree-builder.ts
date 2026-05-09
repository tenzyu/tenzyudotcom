import {
  compareSkinAssets,
  isLazerMeaningful,
  type ClassifiedSkinAsset,
  type RequiredLevel,
  type SkinKind,
  type SkinMeaning,
} from "../domain/skin-asset";
import type {
  TaxonomyCategory,
  TaxonomyGroup,
  TaxonomyScope,
} from "../domain/taxonomy";

export type AssetTree = {
  scopes: AssetScopeNode[];
  fileCount: number;
};

export type AssetScopeNode = {
  id: string;
  label: string;
  description?: string;
  order: number;
  fileCount: number;
  lazerMeaningful: boolean;
  categories: AssetCategoryNode[];
};

export type AssetCategoryNode = {
  id: string;
  label: string;
  description?: string;
  order: number;
  fileCount: number;
  lazerMeaningful: boolean;
  groups: AssetGroupNode[];
};

export type AssetGroupNode = {
  id: string;
  label: string;
  description?: string;
  order: number;
  componentId: string;
  requiredLevel: RequiredLevel;
  kind: SkinKind;
  meaning: SkinMeaning;
  fileCount: number;
  lazerMeaningful: boolean;
  files: ClassifiedSkinAsset[];
};

type MutableScopeNode = Omit<AssetScopeNode, "categories"> & {
  categories: Map<string, MutableCategoryNode>;
};

type MutableCategoryNode = Omit<AssetCategoryNode, "groups"> & {
  groups: Map<string, MutableGroupNode>;
};

type MutableGroupNode = AssetGroupNode;

// function emptyMeaning(): SkinMeaning {
//   return {
//     lazerLegacy: false,
//     lazerNative: false,
//     stable: false,
//   };
// }

function mergeMeaning(target: SkinMeaning, source: SkinMeaning): SkinMeaning {
  return {
    lazerLegacy: target.lazerLegacy || source.lazerLegacy,
    lazerNative: target.lazerNative || source.lazerNative,
    stable: target.stable || source.stable,
  };
}

function getOrInsert<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  const existing = map.get(key);
  if (existing) return existing;

  const created = create();
  map.set(key, created);
  return created;
}

function scopeNodeFrom(scope: TaxonomyScope): MutableScopeNode {
  return {
    id: scope.id,
    label: scope.label,
    description: scope.description,
    order: scope.order,
    fileCount: 0,
    lazerMeaningful: false,
    categories: new Map(),
  };
}

function categoryNodeFrom(category: TaxonomyCategory): MutableCategoryNode {
  return {
    id: category.id,
    label: category.label,
    description: category.description,
    order: category.order,
    fileCount: 0,
    lazerMeaningful: false,
    groups: new Map(),
  };
}

function groupNodeFrom(asset: ClassifiedSkinAsset, group: TaxonomyGroup): MutableGroupNode {
  return {
    id: group.id,
    label: group.label,
    description: group.description,
    order: group.order,
    componentId: asset.componentId,
    requiredLevel: asset.requiredLevel,
    kind: asset.kind,
    meaning: { ...asset.meaning },
    fileCount: 0,
    lazerMeaningful: false,
    files: [],
  };
}

function compareNode(a: { order: number; label: string; id: string }, b: { order: number; label: string; id: string }): number {
  return a.order - b.order || a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
}

function preferKind(current: SkinKind, next: SkinKind): SkinKind {
  if (current === "image" || next === "image") return "image";
  if (current === "audio" || next === "audio") return "audio";
  if (current === "text" || next === "text") return "text";
  if (current === "font" || next === "font") return "font";
  return current;
}

export class AssetTreeBuilder {
  build(files: ClassifiedSkinAsset[]): AssetTree {
    const scopeMap = new Map<string, MutableScopeNode>();

    for (const file of files) {
      const taxonomy = file.taxonomyPath;

      const scopeNode = getOrInsert(
        scopeMap,
        taxonomy.scope.id,
        () => scopeNodeFrom(taxonomy.scope),
      );

      const categoryNode = getOrInsert(
        scopeNode.categories,
        taxonomy.category.id,
        () => categoryNodeFrom(taxonomy.category),
      );

      const groupNode = getOrInsert(
        categoryNode.groups,
        taxonomy.group.id,
        () => groupNodeFrom(file, taxonomy.group),
      );

      groupNode.files.push(file);
      groupNode.fileCount += 1;
      groupNode.kind = preferKind(groupNode.kind, file.kind);
      groupNode.meaning = mergeMeaning(groupNode.meaning, file.meaning);
      groupNode.lazerMeaningful = groupNode.lazerMeaningful || isLazerMeaningful(file.meaning);

      categoryNode.fileCount += 1;
      categoryNode.lazerMeaningful = categoryNode.lazerMeaningful || isLazerMeaningful(file.meaning);

      scopeNode.fileCount += 1;
      scopeNode.lazerMeaningful = scopeNode.lazerMeaningful || isLazerMeaningful(file.meaning);
    }

    const scopes = [...scopeMap.values()]
      .sort(compareNode)
      .map((scope): AssetScopeNode => ({
        ...scope,
        categories: [...scope.categories.values()]
          .sort(compareNode)
          .map((category): AssetCategoryNode => ({
            ...category,
            groups: [...category.groups.values()]
              .sort(compareNode)
              .map((group): AssetGroupNode => ({
                ...group,
                files: [...group.files].sort(compareSkinAssets),
              })),
          })),
      }));

    return {
      scopes,
      fileCount: files.length,
    };
  }
}

export function buildAssetTree(files: ClassifiedSkinAsset[]): AssetTree {
  return new AssetTreeBuilder().build(files);
}