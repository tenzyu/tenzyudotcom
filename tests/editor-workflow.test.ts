import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { $ } from "bun";
import type { ProjectFilesResponse, ProjectManifest } from "../tools/shared/editor-types";

const repoRoot = path.resolve(import.meta.dir, "..");
const serverScript = path.join(repoRoot, "tools/osu-skin-editor.ts");
const workspaces: string[] = [];
const servers: Bun.Subprocess[] = [];

afterEach(async () => {
  for (const server of servers.splice(0)) server.kill();
  for (const workspace of workspaces.splice(0)) await rm(workspace, { recursive: true, force: true });
});

describe("editor workflow", () => {
  test("imports, mixes, deletes, restores, reclassifies, exports, and imports backup", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "osu-editor-workflow-"));
    workspaces.push(workspace);
    const port = 8931 + Math.floor(Math.random() * 200);
    await createFixtureSkin(path.join(workspace, "main-skin"), {
      "skin.ini": "[General]\nName: Main\n[Fonts]\nScorePrefix: score\n",
      "hitcircle.png": "main-hitcircle",
      "hitcircleoverlay.png": "main-overlay",
      "default-1.png": "main-number",
      "normal-hitnormal.wav": "main-audio",
      "spinner-warning.png": "main-shaker",
      "ranking-A.png": "stable-ranking",
    });
    await createFixtureSkin(path.join(workspace, "asset-skin"), {
      "skin.ini": "[General]\nName: Asset\n[Fonts]\nScorePrefix: score\n",
      "hitcircle.png": "asset-hitcircle",
      "hitcircleoverlay.png": "asset-overlay",
      "default-1.png": "asset-number",
      "normal-hitnormal.wav": "asset-audio",
      "mania-note1.png": "asset-mania-note",
    });
    const mainOsk = path.join(workspace, "main.osk");
    await $`zip -qr ${mainOsk} .`.cwd(path.join(workspace, "main-skin"));

    const server = Bun.spawn(["bun", "run", serverScript, "--no-open", "--port", String(port)], {
      cwd: workspace,
      stdout: "pipe",
      stderr: "pipe",
    });
    servers.push(server);
    await waitForHealth(port);

    const project = await request<ProjectManifest>(port, "/api/projects/import-main", {
      method: "POST",
      body: JSON.stringify({ sourcePath: mainOsk, name: "workflow" }),
    });
    await request<ProjectManifest>(port, `/api/projects/${project.id}/import-assets`, {
      method: "POST",
      body: JSON.stringify({ sourcePath: path.join(workspace, "asset-skin"), name: "asset" }),
    });

    let files = await request<ProjectFilesResponse>(port, `/api/projects/${project.id}/files`);
    const source = files.sources.find((item) => item.name === "asset");
    expect(source).toBeTruthy();
    const hitcircle = files.matrix.rows.find((row) => row.groupKey === "hitcircle");
    expect(hitcircle?.cells.project.files.length).toBe(1);
    expect(hitcircle?.cells[source!.id].files.length).toBe(1);

    await request(port, `/api/projects/${project.id}/mix`, {
      method: "POST",
      body: JSON.stringify({
        items: [{ sourceId: source!.id, paths: hitcircle!.cells[source!.id].files.map((file) => file.path), action: "replace" }],
      }),
    });
    files = await request<ProjectFilesResponse>(port, `/api/projects/${project.id}/files`);
    expect(await readFile(path.join(workspace, "skin-editor-projects", project.id, "structured", files.matrix.rows.find((row) => row.groupKey === "hitcircle")!.cells.project.files[0].path), "utf8")).toBe("asset-hitcircle");

    const overlay = files.matrix.rows.find((row) => row.groupKey === "hitcircleoverlay")!;
    await request(port, `/api/projects/${project.id}/file?path=${encodeURIComponent(overlay.cells.project.files[0].path)}`, { method: "DELETE" });
    files = await request<ProjectFilesResponse>(port, `/api/projects/${project.id}/files`);
    expect(files.matrix.rows.find((row) => row.groupKey === "hitcircleoverlay")!.cells.project.missing).toBe(true);

    await request(port, `/api/projects/${project.id}/restore`, {
      method: "POST",
      body: JSON.stringify({ sourceId: "main", paths: overlay.cells.main.files.map((file) => file.path) }),
    });
    files = await request<ProjectFilesResponse>(port, `/api/projects/${project.id}/files`);
    expect(files.matrix.rows.find((row) => row.groupKey === "hitcircleoverlay")!.cells.project.missing).toBe(false);

    const skinIni = files.project.find((file) => file.flatPath === "skin.ini")!;
    await request(port, `/api/projects/${project.id}/file?path=${encodeURIComponent(skinIni.path)}`, {
      method: "PUT",
      body: JSON.stringify({ content: "[General]\nName: Edited\n" }),
    });
    await request(port, `/api/projects/${project.id}/reclassify-preview`, { method: "POST", body: "{}" });
    await request(port, `/api/projects/${project.id}/reclassify`, { method: "POST", body: "{}" });

    const exported = await request<{ exports: { flat: string; osk: string; backup: string }; counts: Record<string, number> }>(port, `/api/projects/${project.id}/export`, {
      method: "POST",
      body: JSON.stringify({ preset: "full", formats: ["flat", "osk", "backup"], resolution: "full", includeStable: true, includeExtras: true }),
    });
    expect(exported.counts.flat).toBeGreaterThan(0);
    expect(exported.exports.osk).toEndWith(".osk");
    expect(exported.exports.backup).toEndWith(".backup.zip");

    const importedBackup = await request<ProjectManifest>(port, "/api/projects/import-backup", {
      method: "POST",
      body: JSON.stringify({ sourcePath: path.join(workspace, exported.exports.backup) }),
    });
    expect(importedBackup.name).toContain("backup");
  });
});

async function createFixtureSkin(root: string, files: Record<string, string>) {
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

async function waitForHealth(port: number) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    try {
      await request(port, "/api/health");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error("server did not become healthy");
}

async function request<T = unknown>(port: number, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json() as T;
}
