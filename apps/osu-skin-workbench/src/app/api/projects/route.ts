import { NextResponse } from "next/server";
import { createProject } from "../../../lib/server/project-service";
import { listProjects } from "../../../lib/server/project-store";
import { errorJson, readJsonBody, requiredString } from "../../../lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);

    const project = await createProject({
      sourcePath: requiredString(body, "sourcePath"),
      name: typeof body.name === "string" ? body.name : undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}
