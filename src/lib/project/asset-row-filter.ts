import type { RequiredLevel } from "../domain/skin-asset";
import type { AssetMatrixRow } from "./asset-matrix-builder";

export type RequiredLevelFilter = "all" | RequiredLevel;

export type AssetRowFilter = {
  scope: string;
  category: string;
  text: string;
  primaryRowsOnly: boolean;
  collapseStable: boolean;
  requiredLevel: RequiredLevelFilter;
};

export function filterAssetRows(rows: AssetMatrixRow[], filter: AssetRowFilter): AssetMatrixRow[] {
  const text = filter.text.trim().toLowerCase();

  return rows.filter((row) => {
    if (row.scope !== filter.scope) return false;
    if (row.category !== filter.category) return false;
    if (filter.primaryRowsOnly && !row.lazerMeaningful) return false;
    if (filter.collapseStable && row.scope === "stable") return false;
    if (filter.requiredLevel !== "all" && row.requiredLevel !== filter.requiredLevel) return false;

    if (!text) return true;

    const haystack = [
      row.groupLabel,
      row.componentId,
      row.scope,
      row.category,
      row.groupKey,
      row.taxonomy.label,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(text);
  });
}
