import { NextResponse } from "next/server";
import { deleteAssetGroupFromProject } from "../../../../../../lib/server/project-service";
import { errorJson, readJsonBody } from "../../../../../../lib/server/http";
import type {
  DeleteAssetGroupRequest,
  RouteContext,
} from "../../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    const body = await readJsonBody<Partial<DeleteAssetGroupRequest>>(request);
    const projectPaths = Array.isArray(body.projectPaths)
      ? body.projectPaths.filter((value): value is string => typeof value === "string")
      : [];

    const result = await deleteAssetGroupFromProject({ projectId, projectPaths });

    return NextResponse.json({ result });
  } catch (error) {
    return errorJson(error);
  }
}
