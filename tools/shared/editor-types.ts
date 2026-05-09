export type Scope =
  | "std"
  | "mania"
  | "catch"
  | "taiko"
  | "interface"
  | "fonts"
  | "configs"
  | "sounds"
  | "stable"
  | "extras";

export type SkinKind = "image" | "audio" | "text" | "font" | "other";

export type SourceManifest = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  files: Record<string, string>;
};

export type HistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  manifestBeforePath: string;
  files: Array<{
    path: string;
    existed: boolean;
    backupPath?: string;
  }>;
};

export type ProjectManifest = {
  id: string;
  name: string;
  mainSourcePath: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, string>;
  sources: SourceManifest[];
  exports?: {
    flat?: string;
    osk?: string;
    diff?: string;
    backup?: string;
  };
  history?: HistoryEntry[];
  warningStates?: Record<string, { ignored?: boolean; read?: boolean }>;
};

export type EditorFile = {
  scope: "project" | "source";
  sourceId?: string;
  path: string;
  flatPath: string;
  ruleId: string;
  componentId: string;
  requiredLevel: "required" | "recommended" | "optional";
  category: string;
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
  modes: string[];
  kind: SkinKind;
  lazerMeaningful: boolean;
  name: string;
  url: string;
  exists: boolean;
};

export type CellWarning = {
  type: string;
  message: string;
};

export type MatrixCell = {
  files: EditorFile[];
  missing: boolean;
  hasHd: boolean;
  hasSd: boolean;
  warnings: CellWarning[];
  previewKind: "image" | "audio" | "text" | "font" | "other" | "empty";
};

export type MatrixRow = {
  rowKey: string;
  ruleId: string;
  componentId: string;
  requiredLevel: "required" | "recommended" | "optional";
  scope: Scope;
  category: string;
  groupKey: string;
  groupLabel: string;
  lazerMeaningful: boolean;
  cells: Record<string, MatrixCell>;
  warnings: CellWarning[];
};

export type ValidationWarning = {
  id: string;
  rowKey: string;
  type: string;
  severity: "warning" | "info";
  scope: string;
  category: string;
  group: string;
  side: "project" | "source" | "row";
  message: string;
  ignored?: boolean;
  read?: boolean;
};

export type ProjectFilesResponse = {
  project: EditorFile[];
  projectGrouped: unknown[];
  sources: Array<SourceManifest & { files: EditorFile[]; grouped: unknown[] }>;
  matrix: {
    columns: Array<{ id: string; label: string; kind: string }>;
    rows: MatrixRow[];
  };
  validation: {
    warnings: ValidationWarning[];
    count: number;
  };
  scopes: Scope[];
};

export type HistoryEntrySummary = {
  id: string;
  action: string;
  createdAt: string;
  affectedCount: number;
  label: string;
};

export type ExportResult = {
  ok: true;
  exports: NonNullable<ProjectManifest["exports"]>;
  counts: Record<string, number>;
  settings: {
    preset: string;
    formats: string[];
    resolution: string;
    includeStable: boolean;
    includeExtras: boolean;
  };
  resultSummary: Array<{ format: string; path: string; count: number }>;
  validation: ProjectFilesResponse["validation"];
};
