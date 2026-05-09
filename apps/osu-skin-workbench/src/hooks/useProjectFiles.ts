"use client";

import { useMemo, useState } from "react";
import { fetchProjectFiles as fetchProjectFilesApi } from "../lib/client/project-api";
import { createEmptyAssetMatrix } from "../lib/project/asset-matrix-seeds";
import type { ProjectFilesResponse } from "../lib/shared/project-contract";

export function useProjectFiles() {
  const [files, setFiles] = useState<ProjectFilesResponse | null>(null);

  const matrix = useMemo(() => files?.matrix ?? createEmptyAssetMatrix(), [files?.matrix]);

  async function fetchProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
    const nextFiles = await fetchProjectFilesApi(projectId);
    setFiles(nextFiles);
    return nextFiles;
  }

  return {
    files,
    matrix,
    fetchProjectFiles,
    setFiles,
  };
}
