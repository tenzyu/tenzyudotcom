import type { AssetMatrixDto, AssetTreeDto, SkinAssetDto } from "./asset-dto";

export type SourceManifest = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  readonly?: boolean;
};

export type ProjectManifest = {
  id: string;
  name: string;
  mainSourcePath: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceManifest[];
};

export type ProjectFilesResponse = {
  project: SkinAssetDto[];
  projectTree: AssetTreeDto;
  sources: Array<SourceManifest & { assets: SkinAssetDto[]; tree: AssetTreeDto }>;
  matrix: AssetMatrixDto;
};

export type ProjectsResponse = {
  projects: ProjectManifest[];
};

export type ProjectResponse = {
  project: ProjectManifest;
};

export type ApiErrorResponse = {
  error: string;
};

export type ExportPreset = "full" | "sd-only" | "hd-only" | "diff" | "backup";

export type ExportRequest = {
  preset?: ExportPreset;
};

export type ExportResult = {
  preset: ExportPreset;
  outputPath: string;
  fileCount: number;
  excludedCount: number;
  notes: string[];
};

export type RebuildStructuredResult = {
  projectFileCount: number;
  sourceFileCounts: Record<string, number>;
};

export type ApplyAssetGroupRequest = {
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths?: string[];
};

export type DeleteAssetGroupRequest = {
  projectPaths: string[];
};

export type AssetMutationResult = {
  copiedCount: number;
  deletedCount: number;
  rebuiltStructuredCount: number;
};

export type RouteContext<T extends Record<string, string>> = {
  params: Promise<T>;
};
