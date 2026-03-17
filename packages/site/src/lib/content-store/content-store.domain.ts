export type StoredCollectionState<T> = {
  collection: T
  serialized: string
  version: string
}

export type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

export const LOCALE_PREFIXES = ['/ja', '/en'] as const

export function withLocaleRevalidatePaths(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export class StorageError extends Error {}
export class StorageNotFoundError extends StorageError {}
export class StorageVersionConflictError extends StorageError {}
