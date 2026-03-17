import { unstable_cache } from 'next/cache'
import { env } from '@/config/env.infra'
import {
  StorageError,
  StorageVersionConflictError,
} from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import { getContentTagForPathname } from './content-tags.infra'

type GitHubContentFile = {
  content: string
  htmlUrl?: string
  path: string
  sha: string
  size: number
}

type GitHubContentsApiResponse = {
  content?: string
  download_url?: string | null
  html_url?: string | null
  path: string
  sha: string
  size: number
}

export type GitHubBlogIndexEntry = {
  pathname: string
  slug: string
  metadata: {
    image?: string
    publishedAt: string
    summary: string
    tags?: string[]
    title: string
    updatedAt?: string
  }
}

function getGitHubConfig() {
  if (
    !env.githubContentOwner ||
    !env.githubContentRepo ||
    !env.githubContentBranch
  ) {
    throw new StorageError(
      'GitHub content storage is not configured. Set GITHUB_CONTENT_OWNER, GITHUB_CONTENT_REPO, and GITHUB_CONTENT_BRANCH.',
    )
  }

  return {
    branch: env.githubContentBranch,
    owner: env.githubContentOwner,
    repo: env.githubContentRepo,
    root: env.githubContentRoot ?? 'storage',
    token: env.githubContentToken,
  }
}

function toRepositoryPath(pathname: string) {
  const normalizedPathname = pathname.replace(/^\/+/, '')
  const { root } = getGitHubConfig()
  return [root.replace(/^\/+|\/+$/g, ''), normalizedPathname]
    .filter(Boolean)
    .join('/')
}

function buildGitHubContentsApiPath(pathname: string) {
  const { owner, repo } = getGitHubConfig()
  const repositoryPath = toRepositoryPath(pathname)
  const encodedPath = repositoryPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')

  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`
}

function buildGitHubContentsReadUrl(pathname: string) {
  const { branch } = getGitHubConfig()
  return `${buildGitHubContentsApiPath(pathname)}?ref=${encodeURIComponent(branch)}`
}

function buildGitHubTreesApiUrl() {
  const { branch, owner, repo } = getGitHubConfig()
  return `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
}

function getGitHubHeaders(extraHeaders?: Record<string, string>) {
  const { token } = getGitHubConfig()

  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'User-Agent': 'tenzyudotcom-content-sync',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extraHeaders,
  }
}

async function readGitHubFile(
  pathname: string,
  options: {
    fresh?: boolean
  } = {},
): Promise<GitHubContentFile | null> {
  const response = await fetch(buildGitHubContentsReadUrl(pathname), {
    cache: options.fresh ? 'no-store' : 'default',
    headers: getGitHubHeaders(),
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new StorageError(
      `Failed to read GitHub content (${pathname}): ${response.status} ${response.statusText}`,
    )
  }

  const payload = (await response.json()) as GitHubContentsApiResponse
  const encodedContent = payload.content?.replace(/\n/g, '')

  if (!encodedContent) {
    throw new StorageError(`GitHub content payload is missing body: ${pathname}`)
  }

  return {
    content: Buffer.from(encodedContent, 'base64').toString('utf8'),
    htmlUrl: payload.html_url ?? payload.download_url ?? undefined,
    path: payload.path,
    sha: payload.sha,
    size: payload.size,
  }
}

export async function loadGitHubTextFile(pathname: string) {
  const tag = getContentTagForPathname(pathname)

  return unstable_cache(
    async () => readGitHubFile(pathname, { fresh: true }),
    ['github-content-file', pathname],
    { tags: [tag] },
  )()
}

export async function loadGitHubTextFileFresh(pathname: string) {
  return readGitHubFile(pathname, { fresh: true })
}

export async function loadGitHubJsonFile<T>(pathname: string): Promise<T | null> {
  const file = await loadGitHubTextFile(pathname)

  if (!file) {
    return null
  }

  return JSON.parse(file.content) as T
}

export async function saveGitHubTextFile(
  pathname: string,
  content: string,
  options: {
    expectedVersion?: string
    message?: string
  } = {},
) {
  const current = await loadGitHubTextFileFresh(pathname)
  const currentVersion = createContentVersion((current?.content ?? '').trimEnd())

  if (
    typeof options.expectedVersion === 'string' &&
    currentVersion !== options.expectedVersion
  ) {
    throw new StorageVersionConflictError(
      `${pathname} has changed since it was loaded.`,
    )
  }

  const { branch } = getGitHubConfig()
  const response = await fetch(buildGitHubContentsApiPath(pathname), {
    body: JSON.stringify({
      branch,
      content: Buffer.from(content).toString('base64'),
      message: options.message ?? `Update ${pathname}`,
      sha: current?.sha,
    }),
    headers: {
      ...getGitHubHeaders(),
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new StorageError(
      `Failed to save GitHub content (${pathname}): ${response.status} ${response.statusText} ${errorText}`,
    )
  }
}

export async function deleteGitHubTextFile(
  pathname: string,
  options: {
    message?: string
  } = {},
) {
  const current = await loadGitHubTextFileFresh(pathname)

  if (!current) {
    return
  }

  const { branch } = getGitHubConfig()
  const response = await fetch(buildGitHubContentsApiPath(pathname), {
    body: JSON.stringify({
      branch,
      message: options.message ?? `Delete ${pathname}`,
      sha: current.sha,
    }),
    headers: {
      ...getGitHubHeaders(),
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new StorageError(
      `Failed to delete GitHub content (${pathname}): ${response.status} ${response.statusText} ${errorText}`,
    )
  }
}

export async function loadGitHubBlogIndex() {
  return (await loadGitHubJsonFile<GitHubBlogIndexEntry[]>('blog/index.json')) ?? []
}

export async function upsertGitHubBlogIndexEntry(entry: GitHubBlogIndexEntry) {
  const currentIndex = await loadGitHubTextFileFresh('blog/index.json')
  const entries = currentIndex
    ? (JSON.parse(currentIndex.content) as GitHubBlogIndexEntry[])
    : []
  const nextEntries = entries.filter(
    (currentEntry) => currentEntry.slug !== entry.slug,
  )

  nextEntries.push(entry)
  nextEntries.sort((a, b) =>
    new Date(b.metadata.publishedAt).getTime() -
    new Date(a.metadata.publishedAt).getTime(),
  )

  await saveGitHubTextFile(
    'blog/index.json',
    `${JSON.stringify(nextEntries, null, 2)}\n`,
    {
      message: `Update blog index for ${entry.slug}`,
    },
  )
}

export async function listGitHubRepositoryFiles(prefix: string) {
  const { root } = getGitHubConfig()
  const normalizedPrefix = [root.replace(/^\/+|\/+$/g, ''), prefix.replace(/^\/+/, '')]
    .filter(Boolean)
    .join('/')

  const response = await fetch(buildGitHubTreesApiUrl(), {
    cache: 'no-store',
    headers: getGitHubHeaders(),
  })

  if (!response.ok) {
    throw new StorageError(
      `Failed to list GitHub repository files: ${response.status} ${response.statusText}`,
    )
  }

  const payload = (await response.json()) as {
    tree?: Array<{ path: string; type: string }>
  }

  return (payload.tree ?? [])
    .filter((entry) => entry.type === 'blob' && entry.path.startsWith(normalizedPrefix))
    .map((entry) => entry.path.slice(root.replace(/^\/+|\/+$/g, '').length + 1))
    .sort()
}
