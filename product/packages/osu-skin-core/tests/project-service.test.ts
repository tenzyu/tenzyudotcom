import { describe, expect, test } from "bun:test";

import { classifySkinFiles } from "../src/classification";
import { buildAssetMatrix, buildAssetTree } from "../src/project";

describe("project API", () => {
  test("builds matrix and tree data through promoted project exports", () => {
    const assets = classifySkinFiles([
      { root: "", relativePath: "skin.ini", fullPath: "/tmp/skin.ini" },
      { root: "", relativePath: "applause-s.wav", fullPath: "/tmp/applause-s.wav" },
      { root: "", relativePath: "hitcircle.png", fullPath: "/tmp/hitcircle.png" },
    ]);

    const matrix = buildAssetMatrix({ project: assets });
    const tree = buildAssetTree(assets);
    const applauseRow = matrix.rows.find((row) => row.groupKey === "applause-s");
    const hitcircleRow = matrix.rows.find((row) => row.groupKey === "hitcircle");

    expect(applauseRow?.scope).toBe("sounds");
    expect(applauseRow?.lazerMeaningful).toBe(true);
    expect(hitcircleRow?.cells.project.assets[0]?.file.fullPath).toBe("/tmp/hitcircle.png");
    expect(tree.fileCount).toBe(3);
    expect(tree.scopes.some((scope) => scope.id === "sounds")).toBe(true);
  });
});
