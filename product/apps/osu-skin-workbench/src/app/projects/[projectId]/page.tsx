import { ProjectWorkspaceClient } from "../../../components/ProjectWorkspaceClient";
import type { RouteContext } from "../../../lib/shared/project-contract";

export default async function ProjectPage({ params }: RouteContext<{ projectId: string }>) {
  const { projectId } = await params;

  return <ProjectWorkspaceClient initialProjectId={projectId} />;
}
