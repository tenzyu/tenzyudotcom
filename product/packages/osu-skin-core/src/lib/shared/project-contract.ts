import type {
  AssetMatrixDto,
  AssetTreeDto,
  DesktopSkinAssetDto,
} from "./asset-dto";

import type { SourceManifest } from './wire';
export type * from './wire';

export type DesktopProjectFilesResponse = {
  project: DesktopSkinAssetDto[];
  projectTree: AssetTreeDto;
  sources: Array<SourceManifest & { assets: DesktopSkinAssetDto[]; tree: AssetTreeDto }>;
  matrix: AssetMatrixDto;
};
