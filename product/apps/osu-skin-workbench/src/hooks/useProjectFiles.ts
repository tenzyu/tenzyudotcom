"use client";

import { useRef, useState } from "react";
import { invokeGetProjectFiles } from "../lib/tauri/project-command.adapter";
import { projectWorkspace, type AssetMatrix } from "@tenzyu/osu-skin-core/project";
import type { DesktopProjectFilesResponse } from "@tenzyu/osu-skin-core/contract";

const emptyAssetMatrix: AssetMatrix = {
  columns: [{ id: "project", label: "Project", kind: "project" }],
  rows: [],
};

export function useProjectFiles(projectId: string | undefined) {
  const [snapshot, setSnapshot] = useState<{
    projectId: string;
    files: DesktopProjectFilesResponse;
  } | null>(null);
  const latestRequest = useRef(0);
  const files = snapshot?.projectId === projectId ? snapshot?.files ?? null : null;
  const matrix = files?.matrix ?? emptyAssetMatrix;

  async function fetchProjectFiles(projectId: string): Promise<DesktopProjectFilesResponse> {
    const request = ++latestRequest.current;
    const nextFiles = projectWorkspace(await invokeGetProjectFiles(projectId));
    if (request === latestRequest.current) setSnapshot({ projectId, files: nextFiles });
    return nextFiles;
  }

  return {
    files,
    matrix,
    fetchProjectFiles,
  };
}
