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

export type ContentSnapshot = {
  version: string
  loadText(pathname: string): Promise<ContentRepositoryTextFile | null>
}

export type ContentWrite = { pathname: string; content: string }

export type AggregateContentRepository = {
  snapshot(): Promise<ContentSnapshot>
  commit(
    expectedVersion: string,
    writes: readonly ContentWrite[],
    message: string,
  ): Promise<string>
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
export class StorageVersionConflictError extends StorageError {
  readonly code = 'content-version-conflict'
}
export class StorageDocumentWriteUncertainError extends StorageError {}
export class StorageCommitUncertainError extends StorageError {
  readonly code = 'content-commit-uncertain'

  constructor(
    message: string,
    readonly candidateOid: string,
  ) {
    super(message)
  }
}

export function isStorageVersionConflict(
  error: unknown,
): error is StorageVersionConflictError {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'content-version-conflict'
  )
}

export function isStorageCommitUncertain(
  error: unknown,
): error is StorageCommitUncertainError {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'content-commit-uncertain' &&
    'candidateOid' in error &&
    typeof error.candidateOid === 'string' &&
    /^[0-9a-f]{40}$/.test(error.candidateOid)
  )
}
