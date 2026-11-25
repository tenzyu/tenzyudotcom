export type StoredCollectionState<T> = {
  collection: T
  serialized: string
  version: string
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

export type ContentTreeChange =
  | ContentWrite
  | { pathname: string; mode: '100644' | '100755'; sha: string | null }

// A revisioned tree is a storage capability, not a GitHub API contract.
export type ContentTreeEntry = {
  path: string
  sha: string
  type: 'blob' | 'tree' | 'commit'
  mode: string
}

export type ContentTreeSnapshot = ContentSnapshot & {
  list(prefix: string): Promise<string[]>
  listTree(prefix: string): Promise<ContentTreeEntry[]>
}

export type RevisionedContentRepository = {
  snapshot(): Promise<ContentTreeSnapshot>
  snapshotAt(version: string): ContentTreeSnapshot
  commit(
    expectedVersion: string,
    writes: readonly ContentTreeChange[],
    message: string,
  ): Promise<string>
  reconcile(candidateOid: string): Promise<string | null>
}

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
