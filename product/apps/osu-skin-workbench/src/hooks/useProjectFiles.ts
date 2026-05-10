"use client";

import { useMemo, useState } from "react";
import { fetchProjectFiles as fetchProjectFilesApi } from "../lib/client/project-api";
import type { AssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import type { ProjectFilesResponse } from "@tenzyu/osu-skin-core/lib/shared/project-contract";

const emptyAssetMatrix: AssetMatrix = {
  columns: [{ id: "project", label: "Project", kind: "project" }],
  rows: [],
};

export function useProjectFiles() {
  const [files, setFiles] = useState<ProjectFilesResponse | null>(null);

  const matrix = useMemo(() => files?.matrix ?? emptyAssetMatrix, [files?.matrix]);

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
