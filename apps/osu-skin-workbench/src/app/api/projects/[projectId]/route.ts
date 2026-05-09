import { NextResponse } from "next/server";
import {
  deleteProject,
  renameProject,
} from "../../../../lib/server/project-service";
import { errorJson, readJsonBody, requiredString } from "../../../../lib/server/http";
import type { RouteContext } from "../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    const body = await readJsonBody(request);
    const project = await renameProject(projectId, requiredString(body, "name"));

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    await deleteProject(projectId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorJson(error);
  }
}
