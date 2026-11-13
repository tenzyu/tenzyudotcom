export const SCRAPS_INDEX_PATHNAME = 'scraps/index.json' as const
export const SCRAPS_INDEX_CONTENT_TAG = 'content:scraps:index' as const

export function getEditorCollectionContentTag(collectionId: string) {
  return `content:editor:${collectionId}`
}

export const BLOG_INDEX_CONTENT_TAG = 'content:blog:index'

export function getBlogPostContentTag(slug: string) {
  return `content:blog:${slug}`
}

export function getScrapContentTag(slug: string) {
  return `content:scraps:${slug}`
}

export function getScrapEntryContentTag(slug: string, entryId: string) {
  return `content:scraps:${slug}:entry:${entryId}`
}

const SCRAPS_PATH_PREFIX = 'scraps/'
const SCRAP_ENTRY_PATH_RE = /^scraps\/([^/]+)\/entries\/([^/]+)\//

export function getContentTagForPathname(pathname: string) {
  if (pathname === 'blog/index.json') {
    return BLOG_INDEX_CONTENT_TAG
  }

  if (pathname === SCRAPS_INDEX_PATHNAME) {
    return SCRAPS_INDEX_CONTENT_TAG
  }

  if (pathname.startsWith('editor/') && pathname.endsWith('.json')) {
    return getEditorCollectionContentTag(
      pathname.slice('editor/'.length, -'.json'.length),
    )
  }

  if (pathname.startsWith('blog/') && pathname.endsWith('.mdx')) {
    return getBlogPostContentTag(pathname.slice('blog/'.length, -'.mdx'.length))
  }

  if (pathname.startsWith(SCRAPS_PATH_PREFIX)) {
    const entryMatch = SCRAP_ENTRY_PATH_RE.exec(pathname)
    if (entryMatch) {
      const [, slug, entryId] = entryMatch
      return getScrapEntryContentTag(slug, entryId)
    }

    const segments = pathname.slice(SCRAPS_PATH_PREFIX.length).split('/')
    const [slug] = segments

    if (slug) {
      return getScrapContentTag(slug)
    }
  }

  return `content:file:${pathname}`
}
