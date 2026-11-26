import { unstable_cache } from 'next/cache'
import { env, isEditorDeploymentAllowed } from '@/config/env.infra'
import {
  type ContentRepository,
  type ContentRepositorySaveOptions,
  type ContentSnapshot,
  StorageError,
} from '@tenzyu/revisioned-content/contracts'
import { createContentVersion } from '@tenzyu/revisioned-content/version'
import { getContentTagForPathname } from '@/config/content-cache'
import {
  createGitHubAggregateRepository,
  createGitHubDocumentRepository,
  type GitHubAggregateRepository,
} from '@tenzyu/revisioned-content/github'

function assertEditorWritesAllowed() {
  if (!isEditorDeploymentAllowed()) {
    throw new StorageError('Content mutations are disabled for this deployment environment.')
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

function getDocumentRepository() {
  return createGitHubDocumentRepository(getGitHubConfig())
}

export async function loadGitHubTextFile(pathname: string) {
  const tag = getContentTagForPathname(pathname)
  const { owner, repo, branch, root } = getGitHubConfig()
  return unstable_cache(
    async () => getDocumentRepository().loadText(pathname),
    ['github-content-file-v2', owner, repo, branch, root, pathname],
    { tags: [tag] },
  )()
}

export async function loadGitHubTextFileFresh(pathname: string) {
  return getDocumentRepository().loadText(pathname)
}

async function loadGitHubJsonFile<T>(pathname: string): Promise<T | null> {
  const file = await loadGitHubTextFile(pathname)
  return file ? JSON.parse(file.content) as T : null
}

export async function saveGitHubTextFile(
  pathname: string,
  content: string,
  options: ContentRepositorySaveOptions = {},
) {
  assertEditorWritesAllowed()
  await getDocumentRepository().saveText(pathname, content, options)
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
  Pick<
    GitHubAggregateRepository,
    'snapshot' | 'snapshotAt' | 'commit' | 'reconcile'
  > = {
  snapshot() {
    return getAggregateRepository().snapshot()
  },
  snapshotAt(version) {
    return getAggregateRepository().snapshotAt(version)
  },
  commit(expectedVersion, writes, message) {
    assertEditorWritesAllowed()
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
    return getDocumentRepository().list(prefix)
  },
  async delete(pathname, options) {
    assertEditorWritesAllowed()
    await getDocumentRepository().deleteText(pathname, options)
  },
}
