import { z } from 'zod'
import {
  type AggregateContentRepository,
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './content-store.domain'

type GitHubAggregateConfig = {
  owner: string
  repo: string
  branch: string
  root: string
  token?: string
}

const ShaResponse = z.object({ sha: z.string().min(1) })
const RefResponse = z.object({ object: ShaResponse })
const CommitResponse = z.object({ tree: ShaResponse })
const FileResponse = z.object({ content: z.string(), sha: z.string() })

export function createGitHubAggregateRepository(
  config: GitHubAggregateConfig,
  request: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): AggregateContentRepository {
  const base = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'tenzyudotcom-content-sync',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  }
  const refPath = `/git/ref/heads/${config.branch.split('/').map(encodeURIComponent).join('/')}`
  const updateRefPath = refPath.replace('/git/ref/', '/git/refs/')

  function repositoryPath(pathname: string) {
    const path = [config.root.replace(/^\/+|\/+$/g, ''), pathname]
      .filter(Boolean)
      .join('/')
    if (
      path.split('/').some((part) => !part || part === '.' || part === '..')
    ) {
      throw new StorageError('Invalid content path')
    }
    return path
  }

  async function api(path: string, method = 'GET', body?: unknown) {
    const response = await request(`${base}${path}`, {
      cache: 'no-store',
      headers,
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (!response.ok) {
      throw new StorageError(
        `GitHub aggregate ${method} failed (${response.status})`,
      )
    }
    return response.json() as Promise<unknown>
  }

  async function head() {
    return RefResponse.parse(await api(refPath)).object.sha
  }

  return {
    async snapshot() {
      const version = await head()
      return {
        version,
        async loadText(pathname) {
          const path = repositoryPath(pathname)
            .split('/')
            .map(encodeURIComponent)
            .join('/')
          const response = await request(
            `${base}/contents/${path}?ref=${encodeURIComponent(version)}`,
            {
              cache: 'no-store',
              headers,
            },
          )
          if (response.status === 404) return null
          if (!response.ok)
            throw new StorageError(
              `GitHub snapshot read failed (${response.status})`,
            )
          const file = FileResponse.parse(await response.json())
          return {
            content: Buffer.from(
              file.content.replace(/\n/g, ''),
              'base64',
            ).toString('utf8'),
            version: file.sha,
          }
        },
      }
    },
    async commit(expectedVersion, writes, message) {
      if (writes.length === 0)
        throw new StorageError('An aggregate commit needs writes')
      if (
        new Set(writes.map((write) => write.pathname)).size !== writes.length
      ) {
        throw new StorageError('Duplicate paths in aggregate commit')
      }
      if ((await head()) !== expectedVersion) {
        throw new StorageVersionConflictError(
          'Content changed. Keep your draft and reload the latest version.',
        )
      }
      const parent = CommitResponse.parse(
        await api(`/git/commits/${encodeURIComponent(expectedVersion)}`),
      )
      const tree = ShaResponse.parse(
        await api('/git/trees', 'POST', {
          base_tree: parent.tree.sha,
          tree: writes.map((write) => ({
            path: repositoryPath(write.pathname),
            mode: '100644',
            type: 'blob',
            content: write.content,
          })),
        }),
      )
      const commit = ShaResponse.parse(
        await api('/git/commits', 'POST', {
          tree: tree.sha,
          parents: [expectedVersion],
          message,
        }),
      )
      // A single parent plus non-force fast-forward rejects a competing branch update.
      let response: Response
      try {
        response = await request(`${base}${updateRefPath}`, {
          headers,
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false }),
        })
      } catch {
        throw new StorageCommitUncertainError(
          `Publication outcome unknown. Keep your draft and reload before retrying. Candidate commit ${commit.sha}.`,
        )
      }
      if (response.status === 409 || response.status === 422) {
        throw new StorageVersionConflictError(
          'Content changed during save. Your draft has been kept.',
        )
      }
      if (!response.ok) {
        throw new StorageCommitUncertainError(
          `Publication could not be confirmed (${response.status}). Keep your draft and reload before retrying. Candidate commit ${commit.sha}.`,
        )
      }
      return commit.sha
    },
  }
}
