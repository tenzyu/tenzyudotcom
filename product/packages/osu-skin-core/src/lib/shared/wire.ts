// Checked-in TypeScript projection of the Rust serde contract. CI regenerates and checks structural equivalence.
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

export type ExportPreset = "full" | "sd-only" | "hd-only" | "diff" | "backup";

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

export type AssetMutationResult = {
  copiedCount: number;
  deletedCount: number;
  rebuiltStructuredCount: number;
};


export type RawFileEntry = {
  relativePath: string;
  fullPath: string;
};

export type RawSourceFiles = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  readonly?: boolean;
  files: RawFileEntry[];
  skinIni: string | null;
};

export type RawProjectFilesResponse = {
  project: RawFileEntry[];
  projectSkinIni: string | null;
  sources: RawSourceFiles[];
};

export type CreateProjectInput = { sourcePath: string; name?: string | null };
export type AddProjectSourceInput = { projectId: string; sourcePath: string; name?: string | null };
export type RenameProjectSourceInput = { projectId: string; sourceId: string; name: string };
export type DeleteProjectSourceInput = { projectId: string; sourceId: string };
export type ExportProjectInput = { projectId: string; preset: ExportPreset };
export type ApplyAssetGroupInput = { projectId: string; sourceId: string; sourcePaths: string[]; replaceProjectPaths?: string[] | null };
export type DeleteAssetGroupInput = { projectId: string; projectPaths: string[] };
