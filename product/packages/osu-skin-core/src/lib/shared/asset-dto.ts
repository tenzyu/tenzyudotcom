import type { ClassifiedSkinAsset } from "../domain/skin-asset";
import type { AssetMatrix } from "../project/asset-matrix-builder";
import type { AssetTree } from "../project/asset-tree-builder";

export type WebSafeSkinAssetDto = ClassifiedSkinAsset;
export type DesktopSkinAssetDto = ClassifiedSkinAsset;
export type SkinAssetDto = WebSafeSkinAssetDto;
export type AssetMatrixDto = AssetMatrix;
export type AssetTreeDto = AssetTree;

export function toWebSafeSkinAssetDto(asset: ClassifiedSkinAsset): WebSafeSkinAssetDto {
  return {
    ...asset,
    file: {
      ...asset.file,
      root: "",
      fullPath: "",
    },
  };
}

export function toDesktopSkinAssetDto(asset: ClassifiedSkinAsset): DesktopSkinAssetDto {
  return {
    ...asset,
    file: {
      ...asset.file,
    },
  };
}

export const toSkinAssetDto = toWebSafeSkinAssetDto;

export function toAssetTreeDto(
  tree: AssetTree,
  toAssetDto: (asset: ClassifiedSkinAsset) => ClassifiedSkinAsset = toWebSafeSkinAssetDto,
): AssetTreeDto {
  return {
    ...tree,
    scopes: tree.scopes.map((scope) => ({
      ...scope,
      categories: scope.categories.map((category) => ({
        ...category,
        groups: category.groups.map((group) => ({
          ...group,
          files: group.files.map(toAssetDto),
        })),
      })),
    })),
  };
}

export function toAssetMatrixDto(
  matrix: AssetMatrix,
  toAssetDto: (asset: ClassifiedSkinAsset) => ClassifiedSkinAsset = toWebSafeSkinAssetDto,
): AssetMatrixDto {
  return {
    ...matrix,
    rows: matrix.rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([columnId, cell]) => [
          columnId,
          {
            ...cell,
            assets: cell.assets.map(toAssetDto),
          },
        ]),
      ),
    })),
  };
}

export function toDesktopAssetTreeDto(tree: AssetTree): AssetTreeDto {
  return toAssetTreeDto(tree, toDesktopSkinAssetDto);
}

export function toDesktopAssetMatrixDto(matrix: AssetMatrix): AssetMatrixDto {
  return toAssetMatrixDto(matrix, toDesktopSkinAssetDto);
}
