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
    aliases: z.array(z.string().refine(isBlogPathPart)).optional(),
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

type BlogOwners = Map<string, BlogIndexEntry | null>

function recordOwner(owners: BlogOwners, key: string, entry: BlogIndexEntry) {
  owners.set(key, owners.has(key) ? null : entry)
}

export function readBlogCatalog(content: string | undefined) {
  let entries: BlogIndexEntry[]
  try {
    entries = content === undefined ? [] : BlogIndex.parse(JSON.parse(content))
    for (const { metadata, pathname } of entries)
      parseBlogFrontmatter(metadata, pathname)
  } catch {
    throw new StorageError('The blog index is invalid. It needs inspection.')
  }

  const canonicals: BlogOwners = new Map()
  const aliases: BlogOwners = new Map()
  const pathnames: BlogOwners = new Map()
  for (const entry of entries) {
    recordOwner(canonicals, entry.slug, entry)
    recordOwner(pathnames, entry.pathname, entry)
    for (const alias of entry.aliases ?? []) recordOwner(aliases, alias, entry)
  }
  return { entries, canonicals, aliases, pathnames }
}

type BlogCatalog = ReturnType<typeof readBlogCatalog>

type BlogAddress =
  | { kind: 'canonical' | 'alias'; entry: BlogIndexEntry }
  | { kind: 'unlisted' }

export function resolveBlogAddress(
  catalog: BlogCatalog,
  slug: string,
): BlogAddress {
  const canonical = catalog.canonicals.get(slug)
  if (canonical) return { kind: 'canonical', entry: canonical }

  const alias = catalog.aliases.get(slug)
  if (
    canonical === null ||
    alias === null ||
    (alias && catalog.canonicals.get(alias.slug) !== alias)
  ) {
    throw new StorageError(
      `The blog address ${JSON.stringify(slug)} has ambiguous catalog ownership.`,
    )
  }
  return alias ? { kind: 'alias', entry: alias } : { kind: 'unlisted' }
}

export function assertUniqueBlogOwnership(catalog: BlogCatalog) {
  for (const [kind, owners] of [
    ['canonical slug', catalog.canonicals],
    ['pathname', catalog.pathnames],
    ['alias', catalog.aliases],
  ] as const) {
    for (const [key, owner] of owners) {
      if (owner === null) {
        throw new StorageError(
          `The blog index has a duplicate ${kind} ${JSON.stringify(key)}. It needs inspection.`,
        )
      }
    }
  }
  for (const alias of catalog.aliases.keys()) {
    if (catalog.canonicals.has(alias)) {
      throw new StorageError(
        `The blog alias ${JSON.stringify(alias)} conflicts with a canonical slug. The blog index needs inspection.`,
      )
    }
  }
}

export function parseBlogIndex(content: string | undefined): BlogIndexEntry[] {
  const catalog = readBlogCatalog(content)
  assertUniqueBlogOwnership(catalog)
  return catalog.entries
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
