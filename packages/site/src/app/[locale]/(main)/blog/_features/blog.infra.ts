import matter from 'gray-matter'
import path from 'node:path'
import { compareBlogPostsByPublishedAtDesc, type BlogFrontmatter, type MDXData } from './blog.domain'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import { listTextDocuments, loadTextDocument, saveTextDocument } from '@/lib/content-store/text-document.infra'
import { createContentVersion } from '@/lib/content-store/content-version.infra'

const BLOG_STORAGE_PREFIX = 'blog/'

async function readBlogPost(pathname: string): Promise<MDXData> {
  const document = await loadTextDocument(pathname)
  if (!document) {
    throw new Error(`Blog post not found: ${pathname}`)
  }

  const { data, content } = matter(document.content)

  return {
    metadata: parseBlogFrontmatter(data, pathname),
    slug: path.basename(pathname, '.mdx'),
    rawContent: content,
    fullRawContent: document.content,
    version: document.version,
  }
}

export async function loadBlogPostsState() {
  const { blobs } = await listTextDocuments(BLOG_STORAGE_PREFIX)
  const posts = await Promise.all(
    blobs
      .filter((blob) => blob.pathname.endsWith('.mdx'))
      .map((blob) => readBlogPost(blob.pathname)),
  )
  const collection = posts.sort(compareBlogPostsByPublishedAtDesc)
  const combinedContent = collection.map((post) => post.fullRawContent).join('')

  return {
    collection,
    serialized: '',
    version: createContentVersion(combinedContent),
  }
}

export async function saveBlogPostState(
  slug: string,
  frontmatter: BlogFrontmatter,
  body: string,
  expectedVersion?: string,
) {
  const content = matter.stringify(body, frontmatter)

  return saveTextDocument(`${BLOG_STORAGE_PREFIX}${slug}.mdx`, content, {
    contentType: 'text/markdown',
    expectedVersion,
  })
}
