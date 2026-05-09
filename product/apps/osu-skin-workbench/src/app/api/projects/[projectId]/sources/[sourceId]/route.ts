import { NextResponse } from "next/server";
import {
  deleteProjectSource,
  renameProjectSource,
} from "../../../../../../lib/server/project-service";
import { errorJson, readJsonBody, requiredString } from "../../../../../../lib/server/http";
import type { RouteContext } from "../../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

type SourceRouteParams = {
  projectId: string;
  sourceId: string;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext<SourceRouteParams>,
) {
  try {
    const { projectId, sourceId } = await params;
    const body = await readJsonBody(request);
    const project = await renameProjectSource({
      projectId,
      sourceId,
      name: requiredString(body, "name"),
    });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<SourceRouteParams>,
) {
  try {
    const { projectId, sourceId } = await params;
    const project = await deleteProjectSource({ projectId, sourceId });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}
