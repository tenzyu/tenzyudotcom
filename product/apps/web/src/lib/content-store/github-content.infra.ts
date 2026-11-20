import { unstable_cache } from 'next/cache'
import { env } from '@/config/env.infra'
import {
  type ContentRepository,
  type ContentSnapshot,
  StorageError,
  StorageVersionConflictError,
} from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import { getContentTagForPathname } from './content-tags.infra'
import {
  createGitHubAggregateRepository,
  type GitHubAggregateRepository,
} from './github-aggregate.infra'

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
    throw new StorageError(
      `GitHub content payload is missing body: ${pathname}`,
    )
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

async function loadGitHubJsonFile<T>(pathname: string): Promise<T | null> {
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
  const currentVersion = createContentVersion(
    (current?.content ?? '').trimEnd(),
  )

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
    if (response.status === 409 || response.status === 422) {
      throw new StorageVersionConflictError(`${pathname} changed during save.`)
    }
    const errorText = await response.text()
    throw new StorageError(
      `Failed to save GitHub content (${pathname}): ${response.status} ${response.statusText} ${errorText}`,
    )
  }
}

async function deleteGitHubTextFile(
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

async function listGitHubRepositoryFiles(prefix: string) {
  const { root } = getGitHubConfig()
  const normalizedPrefix = [
    root.replace(/^\/+|\/+$/g, ''),
    prefix.replace(/^\/+/, ''),
  ]
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
    .filter(
      (entry) =>
        entry.type === 'blob' && entry.path.startsWith(normalizedPrefix),
    )
    .map((entry) => entry.path.slice(root.replace(/^\/+|\/+$/g, '').length + 1))
    .sort()
}

// Next can load this module in separate page and route-handler bundles.
const aggregateKey = Symbol.for('tenzyudotcom.github-content-aggregate')
type Binding = ReturnType<typeof getGitHubConfig>
const processState = globalThis as typeof globalThis & {
  [aggregateKey]?: { binding: Binding; repository: GitHubAggregateRepository }
}

function getAggregateRepository() {
  const binding = getGitHubConfig()
  const current = processState[aggregateKey]
  if (
    current &&
    current.binding.owner === binding.owner &&
    current.binding.repo === binding.repo &&
    current.binding.branch === binding.branch &&
    current.binding.root === binding.root &&
    current.binding.token === binding.token
  )
    return current.repository
  const repository = createGitHubAggregateRepository(binding)
  processState[aggregateKey] = { binding, repository }
  return repository
}

const missingFile = Symbol('Missing immutable content file')

export async function loadGitHubPublication(): Promise<ContentSnapshot> {
  const repo = getAggregateRepository()
  const version = await repo.validateHead()
  const snapshot = repo.snapshotAt(version)
  const { owner, repo: name, root } = getGitHubConfig()
  return {
    version,
    async loadText(pathname) {
      try {
        return await unstable_cache(async () => {
          const file = await snapshot.loadText(pathname)
          if (!file) throw missingFile
          return file
        }, [
          'github-immutable-content-v1',
          owner,
          name,
          root,
          version,
          pathname,
        ])()
      } catch (error) {
        if (error === missingFile) return null
        throw error
      }
    },
  }
}

export const githubContentRepository: ContentRepository &
  Pick<GitHubAggregateRepository, 'snapshot' | 'commit' | 'reconcile'> = {
  snapshot() {
    return getAggregateRepository().snapshot()
  },
  commit(expectedVersion, writes, message) {
    return getAggregateRepository().commit(expectedVersion, writes, message)
  },
  reconcile(candidateOid) {
    return getAggregateRepository().reconcile(candidateOid)
  },
  async loadText(pathname) {
    const file = await loadGitHubTextFile(pathname)
    return file
      ? {
          content: file.content,
          path: file.path,
          version: createContentVersion(file.content.trimEnd()),
        }
      : null
  },
  async saveText(pathname, content, options) {
    await saveGitHubTextFile(pathname, content, options)
  },
  async loadJson<T>(pathname: string) {
    return loadGitHubJsonFile<T>(pathname)
  },
  async saveJson(pathname, value, options) {
    await saveGitHubTextFile(
      pathname,
      `${JSON.stringify(value, null, 2)}\n`,
      options,
    )
  },
  async list(prefix) {
    return listGitHubRepositoryFiles(prefix)
  },
  async delete(pathname, options) {
    await deleteGitHubTextFile(pathname, options)
  },
}
