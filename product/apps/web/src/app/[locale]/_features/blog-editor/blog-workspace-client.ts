import {
  type BlogArticleView,
  BlogArticleViewSchema,
  type BlogWorkspaceRequest,
  type BlogWorkspaceResult,
  BlogWorkspaceResultSchema,
} from './blog-workspace.validation'

const route = '/api/editor/blog/article'

export async function readBlogEditArticle(
  slug: string,
): Promise<BlogArticleView> {
  const response = await fetch(`${route}?slug=${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  })
  if (response.status === 401)
    window.dispatchEvent(new Event('editor-session-invalid'))
  if (!response.ok) throw new Error('The article could not be loaded.')
  return BlogArticleViewSchema.parse(await response.json())
}

export async function writeBlogArticle(
  request: BlogWorkspaceRequest,
): Promise<BlogWorkspaceResult> {
  try {
    const response = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    })
    if (response.status === 401)
      window.dispatchEvent(new Event('editor-session-invalid'))
    return BlogWorkspaceResultSchema.parse(await response.json())
  } catch {
    return {
      kind: 'uncertain',
      message: 'Publication outcome unknown. Check Git before retrying.',
    }
  }
}
