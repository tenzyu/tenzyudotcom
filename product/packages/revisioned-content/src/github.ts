import { z } from 'zod'
import {
  type ContentTreeSnapshot,
  type RevisionedContentRepository,
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './contracts'

type GitHubAggregateConfig = {
  owner: string
  repo: string
  branch: string
  root: string
  token?: string
}

const oidSchema = z.string().regex(/^[0-9a-f]{40}$/)
const ShaResponse = z.object({ sha: oidSchema })
const RefResponse = z.object({ object: ShaResponse })
const CommitResponse = z.object({ tree: ShaResponse })
const FileResponse = ShaResponse.extend({
  type: z.literal('file'),
  encoding: z.literal('base64'),
  size: z.number().int().nonnegative(),
  content: z.string(),
})
const TreeEntry = ShaResponse.extend({
  path: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  mode: z.string(),
})
const TreeResponse = z.object({
  truncated: z.literal(false),
  tree: z.array(TreeEntry),
})
const CompareResponse = z.object({
  status: z.enum(['identical', 'ahead', 'behind', 'diverged']),
  merge_base_commit: ShaResponse,
})

export type GitHubAggregateRepository = RevisionedContentRepository & {
  validateHead(): Promise<string>
}

export function createGitHubAggregateRepository(
  config: GitHubAggregateConfig,
  request: (url: string, init?: RequestInit) => Promise<Response> = (
    url,
    init,
  ) => fetch(url, init),
): GitHubAggregateRepository {
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

  let hint: { etag: string; version: string } | undefined

  async function validateHead() {
    const sent = hint
    const response = await request(`${base}${refPath}`, {
      cache: 'no-store',
      headers: sent ? { ...headers, 'If-None-Match': sent.etag } : headers,
    })
    if (response.status === 304 && sent) return sent.version
    if (response.status !== 200) {
      throw new StorageError(
        `GitHub content ref validation failed (${response.status}).`,
      )
    }
    const version = RefResponse.parse(await response.json()).object.sha
    const etag = response.headers.get('etag')
    if (hint === sent) hint = etag ? { etag, version } : undefined
    return version
  }

  function snapshotAt(oid: string): ContentTreeSnapshot {
    const version = oidSchema.parse(oid)

    async function listTree(prefix: string) {
      const directory = repositoryPath(prefix)
      const commit = CommitResponse.parse(await api(`/git/commits/${version}`))
      const result = TreeResponse.safeParse(
        await api(`/git/trees/${commit.tree.sha}?recursive=1`),
      )
      if (!result.success) {
        throw new StorageError('GitHub did not supply a complete content tree.')
      }
      const root = config.root.replace(/^\/+|\/+$/g, '')
      return result.data.tree
        .filter(({ path }) => path.startsWith(`${directory}/`))
        .map(({ path, ...entry }) => ({
          ...entry,
          path: root ? path.slice(root.length + 1) : path,
        }))
    }

    return {
      version,
      listTree,
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
        const file = FileResponse.safeParse(await response.json())
        if (!file.success) {
          throw new StorageError(
            `GitHub did not supply file bytes and a blob OID for ${pathname}.`,
          )
        }
        const encoded = file.data.content.replace(/\r?\n/g, '')
        const bytes = Buffer.from(encoded, 'base64')
        const content = bytes.toString('utf8')
        if (
          bytes.length !== file.data.size ||
          bytes.toString('base64') !== encoded ||
          !Buffer.from(content).equals(bytes)
        ) {
          throw new StorageError(
            `GitHub supplied incomplete or unsupported file bytes for ${pathname}.`,
          )
        }
        return {
          content,
          version: file.data.sha,
        }
      },
      async list(prefix) {
        return (await listTree(prefix))
          .filter(({ type }) => type !== 'tree')
          .map(({ path }) => path)
      },
    }
  }

  return {
    snapshotAt,
    validateHead,
    async snapshot() {
      return snapshotAt(await head())
    },
    async reconcile(candidateOid) {
      const candidate = oidSchema.parse(candidateOid)
      const current = await head()
      if (current === candidate) return current
      const comparison = CompareResponse.parse(
        await api(`/compare/${candidate}...${current}`),
      )
      return comparison.status === 'ahead' &&
        comparison.merge_base_commit.sha === candidate
        ? current
        : null
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
            type: 'blob',
            ...('sha' in write
              ? { mode: write.mode, sha: write.sha }
              : { mode: '100644', content: write.content }),
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
      const uncertain = () =>
        new StorageCommitUncertainError(
          `Publication outcome unknown. Keep your draft and check publication before retrying. Candidate commit ${commit.sha}.`,
          commit.sha,
        )
      let response: Response
      try {
        response = await request(`${base}${updateRefPath}`, {
          cache: 'no-store',
          headers,
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false }),
        })
      } catch {
        throw uncertain()
      }
      if (response.status === 409 || response.status === 422) {
        throw new StorageVersionConflictError(
          'Content changed during save. Copy your draft and reload the latest version.',
        )
      }
      if ([401, 403, 404, 429].includes(response.status)) {
        throw new StorageError(
          `GitHub rejected the ref update (${response.status}).`,
        )
      }
      if (!response.ok) throw uncertain()
      const updated = RefResponse.safeParse(
        await response.json().catch(() => null),
      )
      if (!updated.success || updated.data.object.sha !== commit.sha)
        throw uncertain()
      return commit.sha
    },
  }
}
