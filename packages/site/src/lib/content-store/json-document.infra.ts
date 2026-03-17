import type { StoredCollectionState } from './content-store.domain'
import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import {
  loadGitHubTextFile,
  saveGitHubTextFile,
} from './github-content.infra'

export async function loadJsonCollection<T>(
  pathname: string,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
): Promise<StoredCollectionState<T>> {
  const serialized = (await loadGitHubTextFile(pathname))?.content ?? null

  if (!serialized) {
    const collection = getDefaultValue()
    const fallbackSerialized = JSON.stringify(collection, null, 2)

    return {
      collection,
      serialized: fallbackSerialized,
      version: createContentVersion(fallbackSerialized),
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
  expectedVersion?: string,
) {
  const parsed = parse(JSON.parse(rawJson))
  const serialized = JSON.stringify(parsed, null, 2)
  const nextVersion = createContentVersion(serialized)

  if (expectedVersion) {
    const currentSerialized = ((await loadGitHubTextFile(pathname))?.content ?? '').trimEnd()
    const currentVersion = createContentVersion(currentSerialized)

    if (currentVersion !== expectedVersion) {
      throw new StorageVersionConflictError(
        `${pathname} has changed since it was loaded.`,
      )
    }
  }

  await saveGitHubTextFile(pathname, `${serialized}\n`, {
    expectedVersion,
    message: `Update ${pathname}`,
  })

  return {
    version: nextVersion,
  }
}
