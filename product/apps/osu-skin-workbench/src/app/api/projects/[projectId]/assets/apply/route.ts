import { NextResponse } from "next/server";
import { applyAssetGroupToProject } from "../../../../../../lib/server/project-service";
import { errorJson, readJsonBody, requiredString } from "../../../../../../lib/server/http";
import type {
  ApplyAssetGroupRequest,
  RouteContext,
} from "../../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    const body = await readJsonBody<Partial<ApplyAssetGroupRequest>>(request);
    const sourcePaths = Array.isArray(body.sourcePaths)
      ? body.sourcePaths.filter((value): value is string => typeof value === "string")
      : [];
    const replaceProjectPaths = Array.isArray(body.replaceProjectPaths)
      ? body.replaceProjectPaths.filter((value): value is string => typeof value === "string")
      : [];

    const result = await applyAssetGroupToProject({
      projectId,
      sourceId: requiredString(body, "sourceId"),
      sourcePaths,
      replaceProjectPaths,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return errorJson(error);
  }
}
