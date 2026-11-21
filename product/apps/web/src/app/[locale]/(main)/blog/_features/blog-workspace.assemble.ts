import { githubContentRepository } from '@/lib/content-store/github-content.infra'
import { compareBlogPostsByPublishedAtDesc, type MDXData } from './blog.domain'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import {
  loadBlogCatalog,
  loadBlogPostForEdit,
  reconcileBlogPublication,
  renameBlogPost,
  saveBlogPost,
} from './blog.infra'

export { renameBlogPost, saveBlogPost }

function toView({ slug, metadata, rawContent, version }: MDXData) {
  return { slug, metadata, rawContent, version }
}

export async function readEditableBlogArticle(slug: string) {
  const article = await loadBlogPostForEdit(slug)
  return article && toView(article)
}

export async function readBlogEditorSummaries() {
  const { entries } = await loadBlogCatalog(
    await githubContentRepository.snapshot(),
  )
  return entries
    .map(({ slug, pathname, metadata }) => ({
      slug,
      metadata: parseBlogFrontmatter(metadata, pathname),
    }))
    .sort(compareBlogPostsByPublishedAtDesc)
}

export async function checkBlogWorkspacePublication(
  slug: string,
  candidate: string,
) {
  const result = await reconcileBlogPublication({
    slug,
    candidateOid: candidate,
  })
  if (!result) return null
  return {
    receipt: result.receipt,
    view: result.view.status === 'ready' ? toView(result.view.post) : undefined,
  }
}
