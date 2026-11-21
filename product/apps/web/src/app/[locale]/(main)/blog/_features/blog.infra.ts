import { isDeepStrictEqual } from 'node:util'
import {
  BlogSlugValidationError,
  blogWriteSlugPattern,
  compareBlogPostsByPublishedAtDesc,
  type BlogPublicationReceipt,
  type BlogPublicationResult,
  type BlogRenameCommand,
  type BlogSaveCommand,
  type MDXData,
} from './blog.domain'
import {
  assertUniqueBlogOwnership,
  BLOG_INDEX_PATH,
  isBlogPathPart,
  parseBlogIndex,
  projectBlogIndexEntry,
  readBlogCatalog,
  resolveBlogAddress,
} from './blog-index.assemble'
import { editBlogSource, readBlogSource } from './blog-source.assemble'
import { githubContentRepository } from '@/lib/content-store/github-content.infra'
import type { GitHubAggregateRepository } from '@/lib/content-store/github-aggregate.infra'
import {
  StorageError,
  StorageVersionConflictError,
  type ContentRepositoryTextFile,
  type ContentSnapshot,
  type ContentTreeChange,
} from '@/lib/content-store/content-store.domain'

function parseBlogPost(
  pathname: string,
  slug: string,
  file: ContentRepositoryTextFile,
): MDXData {
  if (!file.version)
    throw new StorageError(`The blog post has no blob OID: ${pathname}`)
  const { content, metadata } = readBlogSource(file.content, pathname)
  return {
    metadata,
    slug,
    rawContent: content,
    fullRawContent: file.content,
    version: file.version,
  }
}

export async function loadBlogCatalog(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(BLOG_INDEX_PATH)
  return readBlogCatalog(file?.content)
}

export async function loadBlogPostBySlug(
  snapshot: ContentSnapshot,
  slug: string,
  indexedPath: string | undefined,
) {
  if (!isBlogPathPart(slug)) return undefined
  const pathname = indexedPath ?? `blog/${slug}.mdx`
  const file = await snapshot.loadText(pathname)
  if (file) return parseBlogPost(pathname, slug, file)
  if (indexedPath)
    throw new StorageError(`The indexed blog post is missing: ${pathname}`)
  return undefined
}

export async function loadBlogPostsState() {
  const snapshot = await githubContentRepository.snapshot()
  const index = await snapshot.loadText(BLOG_INDEX_PATH)
  const posts = await Promise.all(
    parseBlogIndex(index?.content).map(async ({ pathname, slug }) => {
      const file = await snapshot.loadText(pathname)
      if (!file)
        throw new StorageError(`The indexed blog post is missing: ${pathname}`)
      return parseBlogPost(pathname, slug, file)
    }),
  )
  return {
    collection: posts.sort(compareBlogPostsByPublishedAtDesc),
    serialized: '',
    version: snapshot.version,
  }
}

export async function loadBlogPostForEdit(
  slug: string,
  repo: Pick<GitHubAggregateRepository, 'snapshot'> = githubContentRepository,
): Promise<MDXData | null> {
  if (!isBlogPathPart(slug)) return null
  const snapshot = await repo.snapshot()
  const catalog = await loadBlogCatalog(snapshot)
  assertUniqueBlogOwnership(catalog)
  const address = resolveBlogAddress(catalog, slug)
  if (address.kind === 'unlisted') {
    const pathname = `blog/${slug}.mdx`
    if (catalog.pathnames.has(pathname)) return null
    return (await loadBlogPostBySlug(snapshot, slug, undefined)) ?? null
  }
  const { slug: canonical, pathname } = address.entry
  return (await loadBlogPostBySlug(snapshot, canonical, pathname)) ?? null
}

export async function refreshBlogPublication(
  { slug, receipt }: { slug: string; receipt: BlogPublicationReceipt },
  repo: Pick<GitHubAggregateRepository, 'snapshot'> = githubContentRepository,
): Promise<BlogPublicationResult> {
  try {
    const post = await loadBlogPostForEdit(slug, repo)
    return {
      receipt,
      view: post ? { status: 'ready', post } : { status: 'missing' },
    }
  } catch {
    return { receipt, view: { status: 'unavailable' } }
  }
}

export async function reconcileBlogPublication(
  { slug, candidateOid }: { slug: string; candidateOid: string },
  repo: Pick<
    GitHubAggregateRepository,
    'reconcile' | 'snapshot'
  > = githubContentRepository,
): Promise<BlogPublicationResult | null> {
  const headOid = await repo.reconcile(candidateOid)
  if (!headOid) return null
  return refreshBlogPublication(
    {
      slug,
      receipt: { commitOid: candidateOid, headOid, status: 'reconciled' },
    },
    repo,
  )
}

function requireBlogEditVersion(expectedVersion: string) {
  if (!/^[0-9a-f]{40}$/.test(expectedVersion)) {
    throw new StorageVersionConflictError(
      'This form has an old edit version. Copy your draft and reload the editor.',
    )
  }
}

export async function saveBlogPost(
  command: BlogSaveCommand,
  repo: Pick<
    GitHubAggregateRepository,
    'snapshot' | 'commit'
  > = githubContentRepository,
): Promise<BlogPublicationReceipt> {
  const { slug, intent, changes } = command
  if (!blogWriteSlugPattern.test(slug))
    throw new BlogSlugValidationError('slug')
  if (intent === 'edit') requireBlogEditVersion(command.expectedVersion)
  const defaultPath = `blog/${slug}.mdx`
  const snapshot = await repo.snapshot()
  const index = await snapshot.loadText(BLOG_INDEX_PATH)
  const catalog = readBlogCatalog(index?.content)
  assertUniqueBlogOwnership(catalog)
  const { entries, canonicals, aliases, pathnames } = catalog
  const entry = canonicals.get(slug) ?? undefined
  if (intent === 'create' && (entry || aliases.has(slug))) {
    throw new StorageVersionConflictError(
      'This blog slug is already in use. Choose another URL.',
    )
  }
  if (intent === 'edit' && !entry) {
    throw new StorageVersionConflictError(
      'This blog slug is no longer canonical. Reload the editor.',
    )
  }
  const pathname = entry?.pathname ?? defaultPath
  const defaultOwner = pathnames.get(defaultPath)
  if (defaultOwner && defaultOwner !== entry) {
    throw new StorageError(
      'Another blog entry owns this pathname. The blog index needs inspection.',
    )
  }
  const current = await snapshot.loadText(pathname)
  if (current && !current.version)
    throw new StorageError('The current post has no blob OID.')
  if (entry && !current)
    throw new StorageError(
      'The indexed blog post is missing. The blog index needs inspection.',
    )

  if (intent === 'create') {
    if (current)
      throw new StorageError(
        'An unlisted blog post already exists at this pathname. It needs inspection.',
      )
    if (
      !index &&
      (await snapshot.list('blog')).some((path) => path.endsWith('.mdx'))
    ) {
      throw new StorageError(
        'The blog index is missing and blog posts already exist. The blog index needs inspection.',
      )
    }
  } else if (current?.version !== command.expectedVersion) {
    throw new StorageVersionConflictError(
      'This blog post changed. Copy your draft and reload the editor.',
    )
  }

  const { source, metadata } = editBlogSource(
    pathname,
    current?.content,
    changes,
  )
  const projected = projectBlogIndexEntry(slug, pathname, metadata, entry)
  const projectionMatches = isDeepStrictEqual(projected, entry)
  if (source === current?.content && projectionMatches) {
    return {
      commitOid: snapshot.version,
      headOid: snapshot.version,
      status: 'unchanged',
    }
  }
  const nextEntries = entries.map((previous) =>
    previous.slug === slug ? projected : previous,
  )
  if (!entry) nextEntries.push(projected)
  nextEntries.sort(
    (a, b) =>
      Date.parse(b.metadata.publishedAt) - Date.parse(a.metadata.publishedAt),
  )
  const commitOid = await repo.commit(
    snapshot.version,
    [
      { pathname, content: source },
      {
        pathname: BLOG_INDEX_PATH,
        content:
          projectionMatches && index
            ? index.content
            : `${JSON.stringify(nextEntries, null, 2)}\n`,
      },
    ],
    `${intent === 'create' ? 'Publish' : 'Update'} blog post ${slug}`,
  )
  return { commitOid, headOid: commitOid, status: 'written' }
}

export async function renameBlogPost(
  { oldSlug, newSlug, expectedVersion }: BlogRenameCommand,
  repo: Pick<
    GitHubAggregateRepository,
    'snapshot' | 'commit'
  > = githubContentRepository,
): Promise<BlogPublicationReceipt> {
  if (!isBlogPathPart(oldSlug)) throw new BlogSlugValidationError('oldSlug')
  if (oldSlug !== newSlug && !blogWriteSlugPattern.test(newSlug)) {
    throw new BlogSlugValidationError('newSlug')
  }
  requireBlogEditVersion(expectedVersion)

  const snapshot = await repo.snapshot()
  const catalog = await loadBlogCatalog(snapshot)
  assertUniqueBlogOwnership(catalog)
  const entry = catalog.canonicals.get(oldSlug)
  if (!entry) {
    throw new StorageVersionConflictError(
      'This blog slug is no longer canonical. Reload the editor.',
    )
  }

  const tree = await snapshot.listTree('blog')
  const source = tree.find(({ path }) => path === entry.pathname)
  if (
    source?.type !== 'blob' ||
    (source.mode !== '100644' && source.mode !== '100755')
  ) {
    throw new StorageError(
      'The indexed blog source is missing or is not a regular file. The blog index needs inspection.',
    )
  }
  if (source.sha !== expectedVersion) {
    throw new StorageVersionConflictError(
      'This blog post changed. Copy your draft and reload the editor.',
    )
  }
  if (oldSlug === newSlug) {
    return {
      commitOid: snapshot.version,
      headOid: snapshot.version,
      status: 'unchanged',
    }
  }

  if (catalog.canonicals.has(newSlug) || catalog.aliases.has(newSlug)) {
    throw new StorageVersionConflictError(
      'This blog slug is already in use. Choose another URL.',
    )
  }
  const pathname = `blog/${newSlug}.mdx`
  const writes: ContentTreeChange[] = []
  if (pathname !== entry.pathname) {
    for (const [ownedPath, owner] of catalog.pathnames) {
      if (
        owner !== entry &&
        (ownedPath === pathname || ownedPath.startsWith(`${pathname}/`))
      ) {
        throw new StorageVersionConflictError(
          'Another blog entry owns this pathname. Choose another URL.',
        )
      }
    }
    if (tree.some(({ path }) => path === pathname)) {
      throw new StorageVersionConflictError(
        'An unlisted blog file or directory already occupies this pathname. Choose another URL.',
      )
    }
    writes.push(
      { pathname, mode: source.mode, sha: source.sha },
      { pathname: entry.pathname, mode: source.mode, sha: null },
    )
  }
  const nextEntries = catalog.entries.map((previous) =>
    previous === entry
      ? {
          ...entry,
          slug: newSlug,
          pathname,
          aliases: [...(entry.aliases ?? []), oldSlug],
        }
      : previous,
  )
  writes.push({
    pathname: BLOG_INDEX_PATH,
    content: `${JSON.stringify(nextEntries, null, 2)}\n`,
  })
  const commitOid = await repo.commit(
    snapshot.version,
    writes,
    `Rename blog post ${oldSlug} to ${newSlug}`,
  )
  return { commitOid, headOid: commitOid, status: 'written' }
}
