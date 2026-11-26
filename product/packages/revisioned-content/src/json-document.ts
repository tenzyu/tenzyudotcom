import type { ContentRepositorySaveOptions, StoredCollectionState } from './contracts'
import { StorageVersionConflictError } from './contracts'
import { createContentVersion } from './version'

export type JsonCollectionStorage = {
  load(pathname: string): Promise<{ content: string } | null>
  loadFresh(pathname: string): Promise<{ content: string } | null>
  save(pathname: string, content: string, options?: ContentRepositorySaveOptions): Promise<void>
}

export async function loadJsonCollection<T>(
  pathname: string,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
  storage: JsonCollectionStorage,
): Promise<StoredCollectionState<T>> {
  const serialized = (await storage.load(pathname))?.content
  return parseJsonCollection(serialized, parse, getDefaultValue)
}

export function parseJsonCollection<T>(
  serialized: string | undefined,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
): StoredCollectionState<T> {
  if (serialized === undefined) {
    const collection = getDefaultValue()
    const fallbackSerialized = JSON.stringify(collection, null, 2)

    return {
      collection,
      serialized: fallbackSerialized,
      version: createContentVersion(''),
    }
  }

  const normalized = serialized.trimEnd()

  return {
    collection: parse(JSON.parse(normalized)),
    serialized: normalized,
    version: createContentVersion(normalized),
  }
}

export async function saveJsonCollection<T>(
  pathname: string,
  rawJson: string,
  parse: (raw: unknown) => T,
  expectedVersion: string | undefined,
  storage: JsonCollectionStorage,
) {
  const parsed = parse(JSON.parse(rawJson))
  const serialized = JSON.stringify(parsed, null, 2)
  const nextVersion = createContentVersion(serialized)

  if (expectedVersion) {
    const current = await storage.loadFresh(pathname)
    // An existing empty/malformed JSON document is corruption, not absence.
    const currentVersion = parseJsonCollection(current?.content, parse, () => parsed).version

    if (currentVersion !== expectedVersion) {
      throw new StorageVersionConflictError(
        `${pathname} has changed since it was loaded.`,
      )
    }
  }

  await storage.save(pathname, `${serialized}\n`, {
    expectedVersion,
    message: `Update ${pathname}`,
  })

  return {
    version: nextVersion,
  }
}
