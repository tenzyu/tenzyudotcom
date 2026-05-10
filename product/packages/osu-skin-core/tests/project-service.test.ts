import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  createProject,
  addProjectSource,
  applyAssetGroupToProject,
  deleteAssetGroupFromProject,
  exportProject,
  getProjectFiles,
  rebuildProjectStructuredMirrors,
} from "../src/lib/server/project-service";
import {
  projectDir,
  projectStructuredDir,
  sourceRawDir,
  sourceStructuredDir,
} from "../src/lib/server/fs-path";

const cleanupIds: string[] = [];

afterEach(async () => {
  for (const id of cleanupIds.splice(0)) {
    await rm(projectDir(id), { recursive: true, force: true });
    await rm(path.join(process.cwd(), "exports", id), { recursive: true, force: true });
  }
});

describe("project service", () => {
  test("imports main skin as readonly asset source with raw and structured mirrors", async () => {
    const fixtureRoot = path.join(process.cwd(), "tmp-test-skin");

    await rm(fixtureRoot, { recursive: true, force: true });
    await mkdir(fixtureRoot, { recursive: true });
    await writeFile(path.join(fixtureRoot, "skin.ini"), "[General]\nName: Fixture\n");
    await writeFile(path.join(fixtureRoot, "applause-s.wav"), "fake");
    await writeFile(path.join(fixtureRoot, "hitcircle.png"), "fake");

    try {
      const project = await createProject({
        sourcePath: fixtureRoot,
        name: "Fixture Skin",
      });
      cleanupIds.push(project.id);

      expect(project.sources[0]?.id).toBe("main");
      expect(project.sources[0]?.readonly).toBe(true);
      expect(existsSync(sourceRawDir(project.id, "main"))).toBe(true);
      expect(existsSync(projectStructuredDir(project.id))).toBe(true);
      expect(existsSync(sourceStructuredDir(project.id, "main"))).toBe(true);

      await rm(projectStructuredDir(project.id), { recursive: true, force: true });
      const rebuild = await rebuildProjectStructuredMirrors(project.id);
      expect(rebuild.projectFileCount).toBe(3);
      expect(rebuild.sourceFileCounts.main).toBe(3);
      expect(existsSync(projectStructuredDir(project.id))).toBe(true);

      const files = await getProjectFiles(project.id);
      const applauseRow = files.matrix.rows.find((row) => row.groupKey === "applause-s");

      expect(applauseRow?.scope).toBe("sounds");
      expect(applauseRow?.lazerMeaningful).toBe(true);
      expect(files.project[0]?.file.root).toBe("");
      expect(files.project[0]?.file.fullPath).toBe("");
      expect(files.matrix.rows.flatMap((row) => row.cells.project.assets)[0]?.file.fullPath).toBe("");

      const result = await exportProject({ projectId: project.id, preset: "sd-only" });
      expect(result.fileCount).toBeGreaterThan(0);
      expect(existsSync(result.outputPath)).toBe(true);

      const sourceRoot = path.join(process.cwd(), "tmp-test-source-skin");
      await rm(sourceRoot, { recursive: true, force: true });
      await mkdir(sourceRoot, { recursive: true });
      await writeFile(path.join(sourceRoot, "hitcircleoverlay.png"), "source");

      try {
        const withSource = await addProjectSource({
          projectId: project.id,
          sourcePath: sourceRoot,
          name: "Source Skin",
        });
        const sourceId = withSource.sources.find((source) => source.name === "Source Skin")?.id;
        expect(sourceId).toBeTruthy();

        const applyResult = await applyAssetGroupToProject({
          projectId: project.id,
          sourceId: sourceId!,
          sourcePaths: ["hitcircleoverlay.png"],
          replaceProjectPaths: [],
        });

        expect(applyResult.copiedCount).toBe(1);

        const deleteResult = await deleteAssetGroupFromProject({
          projectId: project.id,
          projectPaths: ["hitcircleoverlay.png"],
        });

        expect(deleteResult.deletedCount).toBe(1);
      } finally {
        await rm(sourceRoot, { recursive: true, force: true });
      }
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});

