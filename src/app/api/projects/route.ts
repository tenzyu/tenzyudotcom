import { NextResponse } from "next/server";
import { createProject } from "../../../lib/server/project-service";
import { listProjects } from "../../../lib/server/project-store";

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
    const body = (await request.json()) as {
      sourcePath?: string;
      name?: string;
    };

    if (!body.sourcePath) {
      return NextResponse.json({ error: "sourcePath is required" }, { status: 400 });
    }

    const project = await createProject({
      sourcePath: body.sourcePath,
      name: body.name,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}

function errorJson(error: unknown, status = 400) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status },
  );
}