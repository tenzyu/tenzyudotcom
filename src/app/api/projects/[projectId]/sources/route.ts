import { NextResponse } from "next/server";
import { addProjectSource } from "../../../../../lib/server/project-service";
import { errorJson, readJsonBody, requiredString } from "../../../../../lib/server/http";
import type { RouteContext } from "../../../../../lib/shared/project-contract";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: RouteContext<{ projectId: string }>) {
  try {
    const { projectId } = await params;
    const body = await readJsonBody(request);

    const project = await addProjectSource({
      projectId,
      sourcePath: requiredString(body, "sourcePath"),
      name: typeof body.name === "string" ? body.name : undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}
