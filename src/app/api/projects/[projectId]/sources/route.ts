import { NextResponse } from "next/server";
import { addProjectSource } from "../../../../../lib/server/project-service";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = (await request.json()) as {
      sourcePath?: string;
      name?: string;
    };

    if (!body.sourcePath) {
      return NextResponse.json({ error: "sourcePath is required" }, { status: 400 });
    }

    const project = await addProjectSource({
      projectId,
      sourcePath: body.sourcePath,
      name: body.name,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}