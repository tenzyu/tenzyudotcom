import { NextResponse } from "next/server";
import { rebuildProjectStructuredMirrors } from "../../../../../lib/server/project-service";
import { errorJson } from "../../../../../lib/server/http";
import type { RouteContext } from "../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: RouteContext<{ projectId: string }>,
) {
  try {
    const { projectId } = await params;
    const result = await rebuildProjectStructuredMirrors(projectId);

    return NextResponse.json({ result });
  } catch (error) {
    return errorJson(error);
  }
}
