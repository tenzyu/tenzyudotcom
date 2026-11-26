import type { DesktopProjectFilesResponse } from '@tenzyu/osu-skin-core/contract';

export function countSourceFiles(files: Pick<DesktopProjectFilesResponse, 'sources'> | null | undefined): number {
  return files?.sources.reduce((sum, source) => sum + source.assets.length, 0) ?? 0;
}
