import { StorageVersionConflictError } from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import {
  githubContentRepository,
  loadGitHubBlogIndex,
  loadGitHubTextFile,
  loadGitHubTextFileFresh,
  saveGitHubTextFile,
} from './github-content.infra'

export function createTextDocumentVersion(content: string) {
  return createContentVersion(content.trimEnd())
}

export async function loadTextDocument(pathname: string) {
  const content = (await loadGitHubTextFile(pathname))?.content ?? null

  if (!content) {
    return null
  }

  return {
    content,
    version: createTextDocumentVersion(content),
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
    const currentContent =
      (await loadGitHubTextFileFresh(pathname))?.content ?? null
    const current = currentContent
      ? {
          content: currentContent,
          version: createTextDocumentVersion(currentContent),
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
    version: createTextDocumentVersion(content),
  }
}

export async function deleteTextDocument(
  pathname: string,
  options: { message?: string } = {},
) {
  await githubContentRepository.delete(pathname, options)
}

/**
 * List text documents stored under a content prefix.
 *
 * This is intended for repair / audit / dev tooling only. Page rendering
 * paths should rely on projection indices (e.g. `blog/index.json`,
 * `scraps/index.json`) instead of walking the GitHub tree on every request.
 *
 * `blog/` is special-cased to keep using the cached blog index payload. All
 * other prefixes fall through to a tree listing.
 */
export async function listTextDocuments(prefix: string) {
  if (prefix === 'blog/') {
    const entries = await loadGitHubBlogIndex()
    return {
      blobs: entries.map((entry) => ({
        pathname: entry.pathname,
        size: 0,
        uploadedAt: new Date(
          entry.metadata.updatedAt ?? entry.metadata.publishedAt,
        ),
        url: entry.pathname,
      })),
    }
  }

  const pathnames = await githubContentRepository.list(prefix)

  return {
    blobs: pathnames.map((pathname) => ({
      pathname,
      size: 0,
      uploadedAt: new Date(0),
      url: pathname,
    })),
  }
}
