import { isDeepStrictEqual } from 'node:util'
import {
  compareBlogPostsByPublishedAtDesc,
  type BlogPublicationReceipt,
  type BlogSaveCommand,
  type MDXData,
} from './blog.domain'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import {
  BLOG_INDEX_PATH,
  parseBlogIndex,
  projectBlogIndexEntry,
} from './blog-index.assemble'
import { editBlogSource, readBlogSource } from './blog-source.assemble'
import { createContentVersion } from '@/lib/content-store/content-version.infra'
import {
  githubContentRepository,
  loadGitHubTextFile,
} from '@/lib/content-store/github-content.infra'
import type { GitHubAggregateRepository } from '@/lib/content-store/github-aggregate.infra'
import {
  StorageError,
  StorageVersionConflictError,
  type ContentRepositoryTextFile,
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

export async function loadBlogPostSummariesState() {
  const file = await loadGitHubTextFile(BLOG_INDEX_PATH)
  const entries = parseBlogIndex(file?.content)
  const collection = entries
    .map(({ pathname, slug, metadata }) => ({
      metadata: parseBlogFrontmatter(metadata, pathname),
      slug,
    }))
    .sort(compareBlogPostsByPublishedAtDesc)
  const serialized = JSON.stringify(entries)
  return { collection, serialized, version: createContentVersion(serialized) }
}

export async function loadBlogPostBySlug(slug: string) {
  const pathname = `blog/${slug}.mdx`
  const file = await loadGitHubTextFile(pathname)
  if (!file) throw new StorageError(`Blog post not found: ${pathname}`)
  return parseBlogPost(pathname, slug, {
    content: file.content,
    version: file.sha,
  })
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

export async function saveBlogPost(
  command: BlogSaveCommand,
  repo: GitHubAggregateRepository = githubContentRepository,
): Promise<BlogPublicationReceipt> {
  const { slug, intent, changes } = command
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    throw new StorageError('Invalid blog slug.')
  if (intent === 'edit' && !/^[0-9a-f]{40}$/.test(command.expectedVersion)) {
    throw new StorageVersionConflictError(
      'This form has an old edit version. Copy your draft and reload the editor.',
    )
  }
  const defaultPath = `blog/${slug}.mdx`
  const snapshot = await repo.snapshot()
  const index = await snapshot.loadText(BLOG_INDEX_PATH)
  const entries = parseBlogIndex(index?.content)
  const entry = entries.find((entry) => entry.slug === slug)
  const pathname = entry?.pathname ?? defaultPath
  if (
    entries.some(
      (other) => other.slug !== slug && other.pathname === defaultPath,
    )
  ) {
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
    if (entry)
      throw new StorageVersionConflictError(
        'This blog slug already exists. Copy your draft and reload the editor.',
      )
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
  } else if (
    !entry ||
    !current ||
    current.version !== command.expectedVersion
  ) {
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
