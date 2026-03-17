import matter from 'gray-matter'
import path from 'node:path'
import {
  compareBlogPostsByPublishedAtDesc,
  type BlogFrontmatter,
  type BlogPostSummary,
  type MDXData,
} from './blog.domain'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import { listTextDocuments, loadTextDocument, saveTextDocument } from '@/lib/content-store/text-document.infra'
import { createContentVersion } from '@/lib/content-store/content-version.infra'
import { loadGitHubBlogIndex, upsertGitHubBlogIndexEntry } from '@/lib/content-store/github-content.infra'
import { isEditorGithubStorage } from '@/config/env.infra'

const BLOG_STORAGE_PREFIX = 'blog/'

function toSerializableBlogFrontmatter(frontmatter: BlogFrontmatter) {
  return {
    title: frontmatter.title,
    summary: frontmatter.summary,
    ...(frontmatter.image ? { image: frontmatter.image } : {}),
    publishedAt: frontmatter.publishedAt,
    ...(frontmatter.updatedAt ? { updatedAt: frontmatter.updatedAt } : {}),
    ...(frontmatter.tags && frontmatter.tags.length > 0
      ? { tags: frontmatter.tags }
      : {}),
  }
}

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

export async function loadBlogPostSummariesState() {
  if (isEditorGithubStorage) {
    const entries = await loadGitHubBlogIndex()
    const collection = entries
      .map((entry) => ({
        metadata: parseBlogFrontmatter(entry.metadata, entry.pathname),
        slug: entry.slug,
      }))
      .sort(compareBlogPostsByPublishedAtDesc)

    return {
      collection,
      serialized: JSON.stringify(entries),
      version: createContentVersion(JSON.stringify(entries)),
    }
  }

  const { blobs } = await listTextDocuments(BLOG_STORAGE_PREFIX)
  const collection = await Promise.all(
    blobs
      .filter((blob) => blob.pathname.endsWith('.mdx'))
      .map(async (blob) => {
        const post = await readBlogPost(blob.pathname)
        return {
          metadata: post.metadata,
          slug: post.slug,
        } satisfies BlogPostSummary
      }),
  )
  const sortedCollection = collection.sort(compareBlogPostsByPublishedAtDesc)
  const serialized = JSON.stringify(sortedCollection)

  return {
    collection: sortedCollection,
    serialized,
    version: createContentVersion(serialized),
  }
}

export async function loadBlogPostBySlug(slug: string) {
  return readBlogPost(`${BLOG_STORAGE_PREFIX}${slug}.mdx`)
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
  const content = matter.stringify(
    body,
    toSerializableBlogFrontmatter(frontmatter),
  )

  const pathname = `${BLOG_STORAGE_PREFIX}${slug}.mdx`
  const result = await saveTextDocument(pathname, content, {
    contentType: 'text/markdown',
    expectedVersion,
  })

  if (isEditorGithubStorage) {
    await upsertGitHubBlogIndexEntry({
      pathname,
      slug,
      metadata: {
        image: frontmatter.image,
        publishedAt: frontmatter.publishedAt.toISOString(),
        summary: frontmatter.summary,
        tags: frontmatter.tags,
        title: frontmatter.title,
        updatedAt: frontmatter.updatedAt?.toISOString(),
      },
    })
  }

  return result
}
