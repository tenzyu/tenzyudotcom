import { describe, expect, test } from "bun:test";
import type { RawSourceFiles } from "@tenzyu/osu-skin-core/contract";
import { projectWorkspace } from "@tenzyu/osu-skin-core/project";
import { countSourceFiles } from "./project-file-count";

function source(id: string, paths: string[]): RawSourceFiles {
  return {
    id,
    name: id,
    sourcePath: `/fixture/${id}`,
    createdAt: "2026-01-01T00:00:00Z",
    readonly: false,
    files: paths.map(relativePath => ({ relativePath, fullPath: `/fixture/${id}/${relativePath}` })),
    skinIni: null,
  };
}

describe("countSourceFiles", () => {
  test("counts projected source assets, not project files", () => {
    const workspace = projectWorkspace({
      project: [{ relativePath: "skin.ini", fullPath: "/fixture/project/skin.ini" }],
      projectSkinIni: null,
      sources: [
        source("first", ["cursor.png", "hitcircle.png"]),
        source("second", ["menu-back.png"]),
        source("empty", []),
      ],
    });
    expect(countSourceFiles(workspace)).toBe(3);
  });

  test("counts no sources as zero", () => {
    expect(countSourceFiles({ sources: [] })).toBe(0);
    expect(countSourceFiles(null)).toBe(0);
    expect(countSourceFiles(undefined)).toBe(0);
  });
});
