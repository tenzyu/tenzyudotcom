import { NextResponse } from "next/server";
import { getProjectFiles } from "../../../../../lib/server/project-service";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const files = await getProjectFiles(projectId);

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}