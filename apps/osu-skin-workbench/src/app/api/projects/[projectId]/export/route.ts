import { NextResponse } from "next/server";
import { exportProject } from "../../../../../lib/server/project-service";
import { errorJson, readJsonBody } from "../../../../../lib/server/http";
import type {
  ExportPreset,
  RouteContext,
} from "../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

const presets = new Set<ExportPreset>(["full", "sd-only", "hd-only", "diff", "backup"]);

export async function POST(
  request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    const body = await readJsonBody(request);
    const preset =
      typeof body.preset === "string" && presets.has(body.preset as ExportPreset)
        ? (body.preset as ExportPreset)
        : "full";
    const result = await exportProject({ projectId, preset });

    return NextResponse.json({ result });
  } catch (error) {
    return errorJson(error);
  }
}
