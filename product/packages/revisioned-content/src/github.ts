import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  type ContentRepositorySaveOptions,
  type ContentTreeSnapshot,
  type RevisionedContentRepository,
  StorageCommitUncertainError,
  StorageDocumentWriteUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './contracts'
import { createContentVersion } from './version'

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
// Both read protocols require the same complete, canonical UTF-8 byte payload.
function decodeFileContent(file: { content: string; size: number }, pathname: string) {
  const encoded = file.content.replace(/\r?\n/g, '')
  const bytes = Buffer.from(encoded, 'base64')
  const content = bytes.toString('utf8')
  if (
    bytes.length !== file.size ||
    bytes.toString('base64') !== encoded ||
    !Buffer.from(content).equals(bytes)
  ) {
    throw new StorageError(
      `GitHub supplied incomplete or unsupported file bytes for ${pathname}.`,
    )
  }
  return content
}

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
        const content = decodeFileContent(file.data, pathname)
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

/**
 * Mutable, single-document GitHub Contents API. Unlike aggregate commits,
 * its optimistic concurrency token is the normalized document hash.
 * Consumers own caching and product rules, not HTTP or GitHub paths.
 */
export function createGitHubDocumentRepository(
  config: GitHubAggregateConfig,
  request: (url: string, init?: RequestInit) => Promise<Response> = (
    url,
    init,
  ) => fetch(url, init),
) {
  const base = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'tenzyudotcom-content-sync',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  }
  const root = config.root.replace(/^\/+|\/+$/g, '')

  function repositoryPath(pathname: string) {
    const relative = pathname.replace(/^\/+/, '')
    const path = [root, relative].filter(Boolean).join('/')
    if (!relative || path.split('/').some((part) => !part || part === '.' || part === '..'))
      throw new StorageError('Invalid content path')
    return path
  }

  function contentsUrl(pathname: string) {
    return `${base}/contents/${repositoryPath(pathname).split('/').map(encodeURIComponent).join('/')}`
  }

  async function loadText(pathname: string) {
    const response = await request(
      `${contentsUrl(pathname)}?ref=${encodeURIComponent(config.branch)}`,
      { cache: 'no-store', headers },
    )
    if (response.status === 404) return null
    if (!response.ok)
      throw new StorageError(`Failed to read GitHub content (${pathname}): ${response.status}`)

    const file = FileResponse.extend({
      path: z.string(),
      html_url: z.string().nullable().optional(),
      download_url: z.string().nullable().optional(),
    }).safeParse(await response.json())
    if (!file.success)
      throw new StorageError(`GitHub content payload is invalid: ${pathname}`)

    if (file.data.path !== repositoryPath(pathname))
      throw new StorageError(`GitHub supplied incomplete or unsupported file bytes for ${pathname}.`)
    const content = decodeFileContent(file.data, pathname)

    return {
      content,
      htmlUrl: file.data.html_url ?? file.data.download_url ?? undefined,
      path: file.data.path,
      sha: file.data.sha,
      size: file.data.size,
    }
  }

  async function saveText(
    pathname: string,
    content: string,
    options: ContentRepositorySaveOptions = {},
  ) {
    const current = await loadText(pathname)
    const currentVersion = createContentVersion((current?.content ?? '').trimEnd())
    if (typeof options.expectedVersion === 'string' &&
        currentVersion !== options.expectedVersion)
      throw new StorageVersionConflictError(`${pathname} has changed since it was loaded.`)

    const bytes = Buffer.from(content)
    const expectedBlob = createHash('sha1')
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest('hex')
    await mutateDocument('PUT', pathname, {
      branch: config.branch,
      content: bytes.toString('base64'),
      message: options.message ?? `Update ${pathname}`,
      sha: current?.sha,
    }, expectedBlob)
  }

  // The same blob CAS and uncertain-outcome boundary applies to saves and deletes.
  async function mutateDocument(
    method: 'PUT' | 'DELETE', pathname: string, body: unknown, expectedBlob?: string,
  ) {
    const response = await request(contentsUrl(pathname), {
      body: JSON.stringify(body),
      headers,
      method,
      cache: 'no-store',
      redirect: 'error',
    }).catch((error: unknown) => {
      throw new StorageDocumentWriteUncertainError(
        'The content write outcome is unknown. Check storage before retrying.', { cause: error },
      )
    })
    if (response.status >= 500 || response.status === 408)
      throw new StorageDocumentWriteUncertainError('The content write outcome is unknown. Check storage before retrying.')
    if (response.status === 409 || response.status === 422)
      throw new StorageVersionConflictError(`${pathname} changed during ${method === 'PUT' ? 'save' : 'delete'}.`)
    if (!response.ok)
      throw new StorageError(`Failed to mutate GitHub content (${pathname}): ${response.status}`)

    // A 2xx alone cannot establish the receipt of the requested Git mutation.
    // The server may have committed before returning a malformed response.
    const uncertain = () => new StorageDocumentWriteUncertainError(
      'The content write outcome is unknown. Check storage before retrying.',
    )
    if (response.status !== 200 && !(method === 'PUT' && response.status === 201))
      throw uncertain()
    const receipt = z.object({
      commit: ShaResponse,
      content: method === 'PUT' ? ShaResponse.extend({ path: z.string() }) : z.null(),
    }).safeParse(await response.json().catch(() => null))
    if (!receipt.success || (method === 'PUT' && (
      receipt.data.content?.sha !== expectedBlob ||
      receipt.data.content?.path !== repositoryPath(pathname)
    ))) throw uncertain()
  }

  async function deleteText(pathname: string, options: { message?: string } = {}) {
    const current = await loadText(pathname)
    if (!current) return
    await mutateDocument('DELETE', pathname, {
      branch: config.branch,
      message: options.message ?? `Delete ${pathname}`,
      sha: current.sha,
    })
  }

  async function list(prefix: string) {
    const relative = prefix.replace(/^\/+|\/+$/g, '')
    const directory = relative ? repositoryPath(relative) : root
    const boundary = directory ? `${directory}/` : ''
    const response = await request(
      `${base}/git/trees/${encodeURIComponent(config.branch)}?recursive=1`,
      { cache: 'no-store', headers },
    )
    if (!response.ok)
      throw new StorageError(`Failed to list GitHub repository files: ${response.status}`)
    const result = TreeResponse.safeParse(await response.json())
    if (!result.success)
      throw new StorageError('GitHub did not supply a complete content tree.')
    return result.data.tree
      .filter((entry) => entry.type === 'blob' && entry.path.startsWith(boundary))
      .map((entry) => root ? entry.path.slice(root.length + 1) : entry.path)
      .sort()
  }

  return { loadText, saveText, deleteText, list }
}
