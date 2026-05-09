import { NextResponse } from "next/server";
import { getProjectFiles } from "../../../../../lib/server/project-service";
import { errorJson } from "../../../../../lib/server/http";
import type { RouteContext } from "../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<{ projectId: string }>) {
  try {
    const { projectId } = await params;
    const files = await getProjectFiles(projectId);

    return NextResponse.json(files);
  } catch (error) {
    return errorJson(error);
  }
}
