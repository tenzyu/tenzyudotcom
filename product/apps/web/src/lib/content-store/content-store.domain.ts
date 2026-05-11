export type StoredCollectionState<T> = {
  collection: T
  serialized: string
  version: string
}

export type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

export type ContentRepositoryTextFile = {
  content: string
  path?: string
  version?: string
}

export type ContentRepositorySaveOptions = {
  expectedVersion?: string
  message?: string
}

export type ContentRepository = {
  loadText(pathname: string): Promise<ContentRepositoryTextFile | null>
  saveText(
    pathname: string,
    content: string,
    options?: ContentRepositorySaveOptions,
  ): Promise<void>
  loadJson<T>(pathname: string): Promise<T | null>
  saveJson<T>(
    pathname: string,
    value: T,
    options?: ContentRepositorySaveOptions,
  ): Promise<void>
  list(prefix: string): Promise<string[]>
  delete(pathname: string, options?: { message?: string }): Promise<void>
}

export const LOCALE_PREFIXES = ['/ja', '/en'] as const

export function withLocaleRevalidatePaths(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export class StorageError extends Error {}
export class StorageVersionConflictError extends StorageError {}
