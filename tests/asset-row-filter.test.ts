import { describe, expect, test } from "bun:test";
import { classifySkinAsset } from "../src/lib/classification/skin-classifier";
import { buildAssetMatrix } from "../src/lib/project/asset-matrix-builder";
import { filterAssetRows } from "../src/lib/project/asset-row-filter";

describe("asset row filter", () => {
  test("keeps primary editor rows and required level filtering separate", () => {
    const matrix = buildAssetMatrix({
      project: [
        classifySkinAsset({ relativePath: "hitcircle.png" }),
        classifySkinAsset({ relativePath: "ranking-panel.png" }),
      ],
    });

    const primaryRows = filterAssetRows(matrix.rows, {
      scope: "std",
      category: "hit-circles",
      text: "",
      primaryRowsOnly: true,
      collapseStable: true,
      requiredLevel: "all",
    });

    expect(primaryRows.some((row) => row.groupKey === "hitcircle")).toBe(true);
    expect(primaryRows.every((row) => row.lazerMeaningful)).toBe(true);

    const requiredRows = filterAssetRows(matrix.rows, {
      scope: "std",
      category: "hit-circles",
      text: "",
      primaryRowsOnly: false,
      collapseStable: false,
      requiredLevel: "required",
    });

    expect(requiredRows.every((row) => row.requiredLevel === "required")).toBe(true);
  });
});
