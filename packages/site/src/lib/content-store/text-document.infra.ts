import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import {
  loadGitHubBlogIndex,
  loadGitHubTextFile,
  saveGitHubTextFile,
} from './github-content.infra'

export async function loadTextDocument(pathname: string) {
  const content = (await loadGitHubTextFile(pathname))?.content ?? null

  if (!content) {
    return null
  }

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
    const currentContent = (await loadGitHubTextFile(pathname))?.content ?? null
    const current = currentContent
      ? {
          content: currentContent,
          version: createContentVersion(currentContent),
        }
      : null

    if (current && current.version !== options.expectedVersion) {
      throw new StorageVersionConflictError(
        `${pathname} has changed since it was loaded.`,
      )
    }
  }

  await saveGitHubTextFile(pathname, content, {
    expectedVersion: options.expectedVersion,
    message: `Update ${pathname}`,
  })

  return {
    version: createContentVersion(content),
  }
}

export async function listTextDocuments(prefix: string) {
  if (prefix !== 'blog/') {
    throw new Error(`Unsupported text document prefix: ${prefix}`)
  }

  const entries = await loadGitHubBlogIndex()
  return {
    blobs: entries.map((entry) => ({
      pathname: entry.pathname,
      size: 0,
      uploadedAt: new Date(entry.metadata.updatedAt ?? entry.metadata.publishedAt),
      url: entry.pathname,
    })),
  }
}
