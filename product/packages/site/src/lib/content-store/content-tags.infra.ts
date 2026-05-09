export function getEditorCollectionContentTag(collectionId: string) {
  return `content:editor:${collectionId}`
}

export const BLOG_INDEX_CONTENT_TAG = 'content:blog:index'

export function getBlogPostContentTag(slug: string) {
  return `content:blog:${slug}`
}

export function getContentTagForPathname(pathname: string) {
  if (pathname === 'blog/index.json') {
    return BLOG_INDEX_CONTENT_TAG
  }

  if (pathname.startsWith('editor/') && pathname.endsWith('.json')) {
    return getEditorCollectionContentTag(
      pathname.slice('editor/'.length, -'.json'.length),
    )
  }

  if (pathname.startsWith('blog/') && pathname.endsWith('.mdx')) {
    return getBlogPostContentTag(pathname.slice('blog/'.length, -'.mdx'.length))
  }

  return `content:file:${pathname}`
}
