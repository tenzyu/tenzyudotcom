import type { StoredCollectionState } from './content-store.domain'
import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import { makeContentBlobStore } from './blob-store.infra'

export async function loadJsonCollection<T>(
  pathname: string,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
): Promise<StoredCollectionState<T>> {
  const blob = await makeContentBlobStore().get(pathname)

  if (!blob) {
    const collection = getDefaultValue()
    const serialized = JSON.stringify(collection, null, 2)

    return {
      collection,
      serialized,
      version: createContentVersion(serialized),
    }
  }

  const serialized = await blob.text()
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
    const current = await makeContentBlobStore().get(pathname)
    const currentSerialized = current ? (await current.text()).trimEnd() : ''
    const currentVersion = createContentVersion(currentSerialized)

    if (currentVersion !== expectedVersion) {
      throw new StorageVersionConflictError(
        `${pathname} has changed since it was loaded.`,
      )
    }
  }

  await makeContentBlobStore().put(pathname, `${serialized}\n`, {
    allowOverwrite: true,
    contentType: 'application/json',
  })

  return {
    version: nextVersion,
  }
}
