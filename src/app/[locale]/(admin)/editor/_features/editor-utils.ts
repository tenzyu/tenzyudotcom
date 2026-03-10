import { createHash } from 'node:crypto'

export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(index, 1)
  if (!item) {
    return items
  }
  next.splice(targetIndex, 0, item)
  return next
}

/**
 * Creates a stable version hash for a given string.
 * This can be used in both Node.js and Browser environments (when using appropriate polyfills or conditional logic).
 */
export function createVersion(content: string): string {
  // Use node:crypto when available (Server Side)
  if (typeof window === 'undefined') {
    return createHash('sha256').update(content).digest('hex').slice(0, 12)
  }

  // Browser-side hashing is not currently needed for comparison but if it were:
  // We would use SubtleCrypto (async) or a library.
  // For now, we mainly need this on the server for versioning.
  // If we need it on the client for optimistic UI, we'd need an async version.
  return 'client-side-stub'
}
