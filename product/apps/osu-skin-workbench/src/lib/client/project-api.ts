"use client";

import { projectWorkspace } from "@tenzyu/osu-skin-core/project";
import type { DesktopProjectFilesResponse } from "@tenzyu/osu-skin-core/contract";
import { invokeGetProjectFiles } from "../tauri/project-command.adapter";

// Preserve the existing application API without a second implementation of IPC forwarding.
export {
  chooseSkinFilePath as chooseSkinFile,
  chooseSkinFilePath as chooseSkinPath,
  chooseSkinFolderPath as chooseSkinDirectory,
} from "../tauri/file-dialog.adapter";
export {
  listProjectManifests as fetchProjects,
  invokeCreateProject as createProject,
  invokeRenameProject as renameProject,
  invokeDeleteProject as deleteProject,
  invokeAddProjectSource as addProjectSource,
  invokeRenameProjectSource as renameProjectSource,
  invokeDeleteProjectSource as deleteProjectSource,
  invokeExportProject as exportProject,
  invokeRebuildStructuredMirrors as rebuildStructuredMirrors,
  invokeApplyAssetGroup as applyAssetGroup,
  invokeDeleteAssetGroup as deleteAssetGroup,
} from "../tauri/project-command.adapter";

export async function fetchProjectFiles(projectId: string): Promise<DesktopProjectFilesResponse> {
  return projectWorkspace(await invokeGetProjectFiles(projectId));
}
