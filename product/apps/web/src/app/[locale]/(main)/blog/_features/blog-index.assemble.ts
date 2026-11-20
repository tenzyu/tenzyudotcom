import { z } from 'zod'
import { StorageError } from '@/lib/content-store/content-store.domain'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import type { BlogFrontmatter } from './blog.domain'

export const BLOG_INDEX_PATH = 'blog/index.json'

export const isBlogPathPart = (part: string) =>
  part.length > 0 &&
  part !== '.' &&
  part !== '..' &&
  !part.includes('\0') &&
  !/[\\/]/.test(part)

const BlogIndex = z.array(
  z.looseObject({
    slug: z.string().refine(isBlogPathPart),
    pathname: z
      .string()
      .refine(
        (pathname) =>
          pathname.startsWith('blog/') &&
          pathname.endsWith('.mdx') &&
          pathname.split('/').every(isBlogPathPart),
      ),
    metadata: z.looseObject({ publishedAt: z.string() }),
  }),
)

export type BlogIndexEntry = z.infer<typeof BlogIndex>[number]

export function parseBlogIndex(content: string | undefined): BlogIndexEntry[] {
  if (content === undefined) return []
  try {
    const entries = BlogIndex.parse(JSON.parse(content))
    if (
      new Set(entries.map(({ slug }) => slug)).size !== entries.length ||
      new Set(entries.map(({ pathname }) => pathname)).size !== entries.length
    ) {
      throw new StorageError('Duplicate blog index entries')
    }
    for (const { metadata, pathname } of entries)
      parseBlogFrontmatter(metadata, pathname)
    return entries
  } catch {
    throw new StorageError(
      'The blog index is invalid or has duplicate entries. It needs inspection.',
    )
  }
}

export function projectBlogIndexEntry(
  slug: string,
  pathname: string,
  metadata: BlogFrontmatter,
  prior?: BlogIndexEntry,
): BlogIndexEntry {
  const projected = { ...prior?.metadata }
  for (const key of [
    'title',
    'summary',
    'image',
    'publishedAt',
    'updatedAt',
    'tags',
  ]) {
    delete projected[key]
  }
  const { title, summary, publishedAt, image, updatedAt, tags } = metadata
  return {
    ...prior,
    slug,
    pathname,
    metadata: {
      ...projected,
      title,
      summary,
      publishedAt: publishedAt.toISOString(),
      ...(image === undefined ? {} : { image }),
      ...(updatedAt === undefined
        ? {}
        : { updatedAt: updatedAt.toISOString() }),
      ...(tags === undefined ? {} : { tags }),
    },
  }
}
