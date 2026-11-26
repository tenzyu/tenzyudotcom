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

test("finalizes each populated and empty cell without changing ordering or warnings", () => {
  const [base] = classifySkinFiles([
    { root: "", relativePath: "hitcircle.png", fullPath: "/tmp/hitcircle.png" },
  ]);
  const frame = (index: number, root: string) => ({
    ...base,
    sequenceIndex: index,
    file: { ...base.file, root, relativePath: `hitcircle-${index}@2x.png` },
  });
  const frames = [frame(3, "first"), frame(0, "second"), frame(3, "third")];
  const input = {
    project: [],
    sources: [
      { id: "source", label: "Source", assets: frames },
      { id: "empty", label: "Empty", assets: [] },
    ],
  };
  const matrix = buildAssetMatrix(input);
  expect(matrix.rows).toHaveLength(1);
  const row = matrix.rows[0];
  expect(row.cells.source.assets.map((asset) => asset.file.root)).toEqual(["second", "first", "third"]);
  expect(row.cells.source.warnings.map((warning) => warning.type)).toEqual(["animationGap", "hdOnly"]);
  expect(row.cells.source.warnings[0]?.message).toBe("animation frames missing: 1, 2");
  expect(row.cells.source.hasHd).toBe(true);
  expect(row.cells.source.hasSd).toBe(false);
  expect(row.cells.source.previewKind).toBe("image");
  expect(row.cells.project.missing).toBe(true);
  expect(row.cells.empty.missing).toBe(true);
  expect(row.cells.empty.previewKind).toBe("empty");
  expect(row.warnings.some((warning) => warning.message === "missing in project but available from asset source")).toBe(true);
  expect(frames.map((asset) => asset.file.root)).toEqual(["first", "second", "third"]);
});

test("reports missing animation frames from classified filenames", () => {
  const assets = classifySkinFiles([
    { relativePath: "followpoint-3@2x.png" },
    { relativePath: "followpoint-0.png" },
    { relativePath: "followpoint-3.png" },
  ]);
  const row = buildAssetMatrix({ project: assets }).rows.find((row) => row.groupKey === "followpoint");
  expect(row?.cells.project.assets.map((asset) => asset.sequenceIndex)).toEqual([0, 3, 3]);
  expect(row?.cells.project.warnings.map((warning) => warning.message)).toEqual(["animation frames missing: 1, 2"]);
});

test("bounds gap diagnostics even for a maximum safe integer frame index", () => {
  const assets = classifySkinFiles([
    { relativePath: "followpoint-0.png" },
    { relativePath: "followpoint-9007199254740991.png" },
    { relativePath: "followpoint-9007199254740992.png" },
  ]);
  const row = buildAssetMatrix({ project: assets }).rows.find((row) => row.groupKey === "followpoint");
  const warning = row?.cells.project.warnings.find((warning) => warning.type === "animationGap");
  expect(warning?.message).toBe(
    `animation frames missing: ${Array.from({ length: 64 }, (_, index) => index + 1).join(", ")}, ... (9007199254740990 total)`,
  );
});
