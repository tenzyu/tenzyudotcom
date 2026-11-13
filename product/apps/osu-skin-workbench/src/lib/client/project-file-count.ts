export type SourceFileCountInput = {
  sources?: unknown;
};

export function countSourceFiles(files: SourceFileCountInput | null | undefined): number {
  const sourceFiles = files?.sources;

  if (Array.isArray(sourceFiles)) {
    return sourceFiles.reduce<number>((sum, entry) => sum + countEntryFiles(entry), 0);
  }

  if (sourceFiles && typeof sourceFiles === "object") {
    return Object.values(sourceFiles as Record<string, unknown>).reduce<number>(
      (sum, entry) => sum + countEntryFiles(entry),
      0,
    );
  }

  return 0;
}

function countEntryFiles(entry: unknown): number {
  if (Array.isArray(entry)) return entry.length;

  if (entry && typeof entry === "object" && Array.isArray((entry as { files?: unknown[] }).files)) {
    return (entry as { files: unknown[] }).files.length;
  }

  return 0;
}
