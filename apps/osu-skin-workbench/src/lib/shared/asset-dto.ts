import type { ClassifiedSkinAsset } from "../domain/skin-asset";
import type { AssetMatrix } from "../project/asset-matrix-builder";
import type { AssetTree } from "../project/asset-tree-builder";

export type SkinAssetDto = ClassifiedSkinAsset;
export type AssetMatrixDto = AssetMatrix;
export type AssetTreeDto = AssetTree;

export function toSkinAssetDto(asset: ClassifiedSkinAsset): SkinAssetDto {
  return {
    ...asset,
    file: {
      ...asset.file,
      root: "",
      fullPath: "",
    },
  };
}

export function toAssetTreeDto(tree: AssetTree): AssetTreeDto {
  return {
    ...tree,
    scopes: tree.scopes.map((scope) => ({
      ...scope,
      categories: scope.categories.map((category) => ({
        ...category,
        groups: category.groups.map((group) => ({
          ...group,
          files: group.files.map(toSkinAssetDto),
        })),
      })),
    })),
  };
}

export function toAssetMatrixDto(matrix: AssetMatrix): AssetMatrixDto {
  return {
    ...matrix,
    rows: matrix.rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([columnId, cell]) => [
          columnId,
          {
            ...cell,
            assets: cell.assets.map(toSkinAssetDto),
          },
        ]),
      ),
    })),
  };
}
