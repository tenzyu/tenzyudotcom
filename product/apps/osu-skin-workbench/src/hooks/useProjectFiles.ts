"use client";

import { useMemo, useState } from "react";
import { fetchProjectFiles as fetchProjectFilesApi } from "../lib/client/project-api";
import type { AssetMatrix } from "@tenzyu/osu-skin-core/project";
import type { DesktopProjectFilesResponse } from "@tenzyu/osu-skin-core/contract";

const emptyAssetMatrix: AssetMatrix = {
  columns: [{ id: "project", label: "Project", kind: "project" }],
  rows: [],
};

export function useProjectFiles() {
  const [files, setFiles] = useState<DesktopProjectFilesResponse | null>(null);

  const matrix = useMemo(() => files?.matrix ?? emptyAssetMatrix, [files?.matrix]);

  async function fetchProjectFiles(projectId: string): Promise<DesktopProjectFilesResponse> {
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
