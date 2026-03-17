import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import { makeContentBlobStore } from './blob-store.infra'

export async function loadTextDocument(pathname: string) {
  const blob = await makeContentBlobStore().get(pathname)
  if (!blob) {
    return null
  }

  const content = await blob.text()

  return {
    content,
    version: createContentVersion(content),
  }
}

export async function saveTextDocument(
  pathname: string,
  content: string,
  options: {
    contentType: string
    expectedVersion?: string
  },
) {
  if (options.expectedVersion) {
    const current = await loadTextDocument(pathname)

    if (current && current.version !== options.expectedVersion) {
      throw new StorageVersionConflictError(
        `${pathname} has changed since it was loaded.`,
      )
    }
  }

  await makeContentBlobStore().put(pathname, content, {
    allowOverwrite: true,
    contentType: options.contentType,
  })

  return {
    version: createContentVersion(content),
  }
}

export async function listTextDocuments(prefix: string) {
  return makeContentBlobStore().list({ prefix })
}
