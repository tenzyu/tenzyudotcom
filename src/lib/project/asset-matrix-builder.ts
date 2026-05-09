import {
  compareSkinAssets,
  isLazerMeaningful,
  type ClassifiedSkinAsset,
  type RequiredLevel,
  type SkinKind,
  type SkinMeaning,
} from "../domain/skin-asset";
import { TaxonomyPath } from "../domain/taxonomy-path";
import type { TaxonomyPathInput } from "../domain/taxonomy";

export type AssetMatrixColumnKind = "project" | "source";

export type AssetMatrixColumn = {
  id: string;
  label: string;
  kind: AssetMatrixColumnKind;
  sourceId?: string;
};

export type AssetMatrixSourceInput = {
  id: string;
  label: string;
  assets: ClassifiedSkinAsset[];
};

export type AssetMatrixRowSeed = {
  rowKey?: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  taxonomyPath: TaxonomyPath | TaxonomyPathInput;
  groupKey?: string;
  groupLabel?: string;
  kind?: SkinKind;
  meaning?: SkinMeaning;
};

export type AssetMatrixBuildInput = {
  project: ClassifiedSkinAsset[];
  sources?: AssetMatrixSourceInput[];
  rowSeeds?: AssetMatrixRowSeed[];
};

export type AssetMatrixWarning = {
  type: string;
  message: string;
  severity: "warning" | "info";
};

export type AssetMatrixCell = {
  assets: ClassifiedSkinAsset[];
  missing: boolean;
  hasHd: boolean;
  hasSd: boolean;
  warnings: AssetMatrixWarning[];
  previewKind: SkinKind | "empty";
};

export type AssetMatrixRow = {
  rowKey: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  taxonomyPath: TaxonomyPath;
  taxonomy: ReturnType<TaxonomyPath["toJSON"]>;
  scope: string;
  category: string;
  groupKey: string;
  groupLabel: string;
  kind: SkinKind | "empty";
  meaning: SkinMeaning;
  lazerMeaningful: boolean;
  cells: Record<string, AssetMatrixCell>;
  warnings: AssetMatrixWarning[];
};

export type AssetMatrix = {
  columns: AssetMatrixColumn[];
  rows: AssetMatrixRow[];
};

function emptyMeaning(): SkinMeaning {
  return {
    lazerLegacy: false,
    lazerNative: false,
    stable: false,
  };
}

function mergeMeaning(target: SkinMeaning, source: SkinMeaning): SkinMeaning {
  return {
    lazerLegacy: target.lazerLegacy || source.lazerLegacy,
    lazerNative: target.lazerNative || source.lazerNative,
    stable: target.stable || source.stable,
  };
}

function hasHdAsset(asset: ClassifiedSkinAsset): boolean {
  return /@2x\.[^.]+$/i.test(asset.file.relativePath);
}

function resolutionState(assets: ClassifiedSkinAsset[]): { hasHd: boolean; hasSd: boolean } {
  const imageAssets = assets.filter((asset) => asset.kind === "image");

  return {
    hasHd: imageAssets.some(hasHdAsset),
    hasSd: imageAssets.some((asset) => !hasHdAsset(asset)),
  };
}

function sequenceWarnings(assets: ClassifiedSkinAsset[]): AssetMatrixWarning[] {
  const indexes = assets
    .map((asset) => asset.sequenceIndex)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  if (indexes.length <= 1) return [];

  const existing = new Set(indexes);
  const missing: number[] = [];

  for (let index = indexes[0]; index <= indexes[indexes.length - 1]; index += 1) {
    if (!existing.has(index)) missing.push(index);
  }

  return missing.length
    ? [
        {
          type: "animationGap",
          severity: "warning",
          message: `animation frames missing: ${missing.join(", ")}`,
        },
      ]
    : [];
}

function previewKindFor(assets: ClassifiedSkinAsset[]): SkinKind | "empty" {
  if (assets.length === 0) return "empty";
  if (assets.some((asset) => asset.kind === "image")) return "image";
  if (assets.some((asset) => asset.kind === "audio")) return "audio";
  if (assets.some((asset) => asset.kind === "text")) return "text";
  if (assets.some((asset) => asset.kind === "font")) return "font";
  return assets[0]?.kind ?? "empty";
}

function matrixCell(assets: ClassifiedSkinAsset[]): AssetMatrixCell {
  const sortedAssets = [...assets].sort(compareSkinAssets);
  const { hasHd, hasSd } = resolutionState(sortedAssets);
  const warnings = sequenceWarnings(sortedAssets);

  if (hasHd && !hasSd) {
    warnings.push({
      type: "hdOnly",
      severity: "warning",
      message: "@2x exists without SD file",
    });
  }

  return {
    assets: sortedAssets,
    missing: sortedAssets.length === 0,
    hasHd,
    hasSd,
    warnings,
    previewKind: previewKindFor(sortedAssets),
  };
}

function emptyCells(columns: AssetMatrixColumn[]): Record<string, AssetMatrixCell> {
  return Object.fromEntries(columns.map((column) => [column.id, matrixCell([])]));
}

function taxonomyPathFromSeed(seed: AssetMatrixRowSeed): TaxonomyPath {
  return seed.taxonomyPath instanceof TaxonomyPath
    ? seed.taxonomyPath
    : TaxonomyPath.from(seed.taxonomyPath);
}

function rowKeyForAsset(asset: ClassifiedSkinAsset): string {
  return `${asset.taxonomyPath.key}:${asset.componentId}`;
}

function rowKeyForSeed(seed: AssetMatrixRowSeed): string {
  const taxonomyPath = taxonomyPathFromSeed(seed);
  return seed.rowKey ?? `${taxonomyPath.key}:${seed.componentId}`;
}

function baseRowFromAsset(asset: ClassifiedSkinAsset, columns: AssetMatrixColumn[]): AssetMatrixRow {
  return {
    rowKey: rowKeyForAsset(asset),
    componentId: asset.componentId,
    requiredLevel: asset.requiredLevel,
    taxonomyPath: asset.taxonomyPath,
    taxonomy: asset.taxonomyPath.toJSON(),
    scope: asset.taxonomyPath.scope.id,
    category: asset.taxonomyPath.category.id,
    groupKey: asset.taxonomyPath.group.id,
    groupLabel: asset.taxonomyPath.group.label,
    kind: asset.kind,
    meaning: { ...asset.meaning },
    lazerMeaningful: isLazerMeaningful(asset.meaning),
    cells: emptyCells(columns),
    warnings: [],
  };
}

function baseRowFromSeed(seed: AssetMatrixRowSeed, columns: AssetMatrixColumn[]): AssetMatrixRow {
  const taxonomyPath = taxonomyPathFromSeed(seed);
  const meaning = seed.meaning ?? emptyMeaning();

  return {
    rowKey: rowKeyForSeed(seed),
    componentId: seed.componentId,
    requiredLevel: seed.requiredLevel,
    taxonomyPath,
    taxonomy: taxonomyPath.toJSON(),
    scope: taxonomyPath.scope.id,
    category: taxonomyPath.category.id,
    groupKey: seed.groupKey ?? taxonomyPath.group.id,
    groupLabel: seed.groupLabel ?? taxonomyPath.group.label,
    kind: seed.kind ?? "empty",
    meaning,
    lazerMeaningful: isLazerMeaningful(meaning),
    cells: emptyCells(columns),
    warnings: [],
  };
}

function preferKind(current: SkinKind | "empty", next: SkinKind): SkinKind {
  if (current === "empty") return next;
  if (current === "image" || next === "image") return "image";
  if (current === "audio" || next === "audio") return "audio";
  if (current === "text" || next === "text") return "text";
  if (current === "font" || next === "font") return "font";
  return current;
}

function compareRows(a: AssetMatrixRow, b: AssetMatrixRow): number {
  return (
    a.taxonomyPath.scope.order - b.taxonomyPath.scope.order ||
    a.taxonomyPath.category.order - b.taxonomyPath.category.order ||
    a.taxonomyPath.group.order - b.taxonomyPath.group.order ||
    a.groupLabel.localeCompare(b.groupLabel) ||
    a.rowKey.localeCompare(b.rowKey)
  );
}

function addMissingWarnings(row: AssetMatrixRow, columns: AssetMatrixColumn[]): void {
  const projectCell = row.cells.project;
  const sourceHasFiles = columns.some(
    (column) => column.kind === "source" && !row.cells[column.id]?.missing,
  );

  if (row.lazerMeaningful && projectCell?.missing && sourceHasFiles) {
    row.warnings.push({
      type: "missing",
      severity: "warning",
      message: "missing in project but available from asset source",
    });
  }

  if (
    row.requiredLevel !== "optional" &&
    projectCell?.missing &&
    row.groupKey !== "__rule__"
  ) {
    row.warnings.push({
      type: "missing",
      severity: "warning",
      message: `${row.requiredLevel} asset missing in project`,
    });
  }
}

export class AssetMatrixBuilder {
  build(input: AssetMatrixBuildInput): AssetMatrix {
    const sources = input.sources ?? [];

    const columns: AssetMatrixColumn[] = [
      {
        id: "project",
        label: "Project",
        kind: "project",
      },
      ...sources.map((source): AssetMatrixColumn => ({
        id: source.id,
        label: source.label,
        kind: "source",
        sourceId: source.id,
      })),
    ];

    const rowMap = new Map<string, AssetMatrixRow>();

    for (const seed of input.rowSeeds ?? []) {
      const row = baseRowFromSeed(seed, columns);
      rowMap.set(row.rowKey, row);
    }

    const addAssets = (columnId: string, assets: ClassifiedSkinAsset[]) => {
      for (const asset of assets) {
        const rowKey = rowKeyForAsset(asset);
        const row = rowMap.get(rowKey) ?? baseRowFromAsset(asset, columns);

        rowMap.set(rowKey, row);

        const currentCell = row.cells[columnId] ?? matrixCell([]);
        row.cells[columnId] = matrixCell([...currentCell.assets, asset]);

        row.meaning = mergeMeaning(row.meaning, asset.meaning);
        row.lazerMeaningful = row.lazerMeaningful || isLazerMeaningful(asset.meaning);
        row.kind = preferKind(row.kind, asset.kind);

        if (row.requiredLevel === "optional" && asset.requiredLevel !== "optional") {
          row.requiredLevel = asset.requiredLevel;
        }
      }
    };

    addAssets("project", input.project);

    for (const source of sources) {
      addAssets(source.id, source.assets);
    }

    const rows = [...rowMap.values()]
      .map((row) => {
        addMissingWarnings(row, columns);
        return row;
      })
      .sort(compareRows);

    return {
      columns,
      rows,
    };
  }
}

export function buildAssetMatrix(input: AssetMatrixBuildInput): AssetMatrix {
  return new AssetMatrixBuilder().build(input);
}