import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { projectRawDir, safeJoin, sourceRawDir } from "../../../../../lib/server/fs-path";
import { ensureProjectExists } from "../../../../../lib/server/project-service";
import { errorJson } from "../../../../../lib/server/http";
import type { RouteContext } from "../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".ini": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(request: Request, { params }: RouteContext<{ projectId: string }>) {
  try {
    const { projectId } = await params;
    await ensureProjectExists(projectId);

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "project";
    const sourceId = url.searchParams.get("sourceId") ?? "";
    const filePath = url.searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const root =
      scope === "project"
        ? projectRawDir(projectId)
        : scope === "source" && sourceId
          ? sourceRawDir(projectId, sourceId)
          : null;

    if (!root) {
      return NextResponse.json({ error: "invalid scope" }, { status: 400 });
    }

    const target = safeJoin(root, filePath);
    const body = await readFile(target);
    const ext = path.extname(filePath).toLowerCase();

    return new Response(body, {
      headers: {
        "content-type": contentTypes[ext] ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorJson(error);
  }
}
