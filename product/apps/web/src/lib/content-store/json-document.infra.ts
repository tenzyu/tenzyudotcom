import type { StoredCollectionState } from './content-store.domain'
import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import {
  loadGitHubTextFile,
  loadGitHubTextFileFresh,
  saveGitHubTextFile,
} from './github-content.infra'

type JsonCollectionStorage = {
  load: typeof loadGitHubTextFile
  loadFresh: typeof loadGitHubTextFileFresh
  save: typeof saveGitHubTextFile
}

const githubJsonStorage: JsonCollectionStorage = {
  load: loadGitHubTextFile,
  loadFresh: loadGitHubTextFileFresh,
  save: saveGitHubTextFile,
}

export async function loadJsonCollection<T>(
  pathname: string,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
  storage: JsonCollectionStorage = githubJsonStorage,
): Promise<StoredCollectionState<T>> {
  const serialized = (await storage.load(pathname))?.content ?? null

  if (!serialized) {
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
  expectedVersion?: string,
  storage: JsonCollectionStorage = githubJsonStorage,
) {
  const parsed = parse(JSON.parse(rawJson))
  const serialized = JSON.stringify(parsed, null, 2)
  const nextVersion = createContentVersion(serialized)

  if (expectedVersion) {
    const currentSerialized = (
      (await storage.loadFresh(pathname))?.content ?? ''
    ).trimEnd()
    const currentVersion = createContentVersion(currentSerialized)

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
