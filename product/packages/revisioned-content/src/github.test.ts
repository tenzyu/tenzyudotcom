import { describe, expect, test } from 'bun:test'
import { createGitHubAggregateRepository, createGitHubDocumentRepository } from './github'
import { createContentVersion } from './version'
import {
  StorageCommitUncertainError,
  StorageDocumentWriteUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './contracts'

const config = {
  owner: 'local',
  repo: 'test',
  branch: 'content/test',
  root: 'storage',
}
const headA = 'a'.repeat(40)
const headB = 'b'.repeat(40)
const treeA = 'c'.repeat(40)
const treeB = 'd'.repeat(40)
const blob = 'e'.repeat(40)

describe('GitHub aggregate publication', () => {
  test('reads a pinned snapshot and publishes all files with one non-force ref update', async () => {
    const calls: { path: string; method: string; body: unknown }[] = []
    const request = async (url: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(url)).pathname
      const body: unknown = init?.body ? JSON.parse(String(init.body)) : null
      calls.push({ path, method: init?.method ?? 'GET', body })
      if (path.includes('/contents/')) {
        expect(new URL(String(url)).searchParams.get('ref')).toBe(headA)
        return Response.json({
          content: Buffer.from('draft').toString('base64'),
          sha: blob,
          type: 'file',
          encoding: 'base64',
          size: 5,
        })
      }
      if (path.includes('/git/ref/'))
        return Response.json({ object: { sha: headA } })
      if (init?.method === 'GET') return Response.json({ tree: { sha: treeA } })
      if (init?.method === 'PATCH')
        return Response.json({ object: { sha: headB } })
      return Response.json({
        sha: path.endsWith('/trees') ? treeB : headB,
      })
    }
    const repo = createGitHubAggregateRepository(config, request)
    const snapshot = await repo.snapshot()
    expect((await snapshot.loadText('scraps/demo/lead.ja.mdx'))?.content).toBe(
      'draft',
    )
    await repo.commit(
      snapshot.version,
      [
        { pathname: 'scraps/demo/manifest.json', content: '{}' },
        { pathname: 'scraps/index.json', content: '[]' },
      ],
      'Save scrap',
    )
    expect(calls.find((call) => call.path.endsWith('/trees'))?.body).toEqual({
      base_tree: treeA,
      tree: [
        {
          path: 'storage/scraps/demo/manifest.json',
          mode: '100644',
          type: 'blob',
          content: '{}',
        },
        {
          path: 'storage/scraps/index.json',
          mode: '100644',
          type: 'blob',
          content: '[]',
        },
      ],
    })
    expect(
      calls.find(
        (call) => call.method === 'POST' && call.path.endsWith('/commits'),
      )?.body,
    ).toEqual({ tree: treeB, parents: [headA], message: 'Save scrap' })
    expect(calls.filter((call) => call.method === 'PATCH')).toEqual([
      {
        path: '/repos/local/test/git/refs/heads/content/test',
        method: 'PATCH',
        body: { sha: headB, force: false },
      },
    ])
  })

  test.each([
    'tree',
    'commit',
    'race',
    'network',
  ] as const)('%s failure never publishes individual files', async (failure) => {
    let refWrites = 0
    const request = async (url: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(url)).pathname
      expect(init?.method).not.toBe('PUT')
      if (path.includes('/git/ref/'))
        return Response.json({ object: { sha: headA } })
      if (init?.method === 'GET') return Response.json({ tree: { sha: treeA } })
      if (path.endsWith('/trees') && failure === 'tree')
        return new Response('', { status: 500 })
      if (path.endsWith('/commits') && failure === 'commit')
        return new Response('', { status: 500 })
      if (init?.method === 'PATCH') {
        refWrites++
        if (failure === 'network') throw new Error('connection lost')
        return new Response('', { status: 422 })
      }
      return Response.json({ sha: headB })
    }
    const repo = createGitHubAggregateRepository(config, request)
    const expected =
      failure === 'race'
        ? StorageVersionConflictError
        : failure === 'network'
          ? StorageCommitUncertainError
          : StorageError
    await expect(
      repo.commit(
        headA,
        [{ pathname: 'scraps/index.json', content: '[]' }],
        'save',
      ),
    ).rejects.toBeInstanceOf(expected)
    expect(refWrites).toBe(failure === 'tree' || failure === 'commit' ? 0 : 1)
  })

  test('rejects a stale snapshot before preparing objects', async () => {
    let calls = 0
    const request = async () => {
      calls++
      return Response.json({ object: { sha: headB } })
    }
    await expect(
      createGitHubAggregateRepository(config, request).commit(
        headA,
        [{ pathname: 'a', content: 'b' }],
        'save',
      ),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(calls).toBe(1)
  })

  test('uses the validator sent by each independent ref request', async () => {
    let release!: (response: Response) => void
    const delayed = new Promise<Response>((resolve) => {
      release = resolve
    })
    const validators: (string | null)[] = []
    const repo = createGitHubAggregateRepository(config, async (_url, init) => {
      expect(init?.cache).toBe('no-store')
      validators.push(new Headers(init?.headers).get('if-none-match'))
      switch (validators.length) {
        case 1:
          return Response.json(
            { object: { sha: headA } },
            { headers: { etag: '"a"' } },
          )
        case 2:
          return delayed
        case 3:
          return Response.json(
            { object: { sha: headB } },
            { headers: { etag: '"b"' } },
          )
        default:
          return new Response(null, { status: 304 })
      }
    })
    expect(await repo.validateHead()).toBe(headA)
    const earlier = repo.validateHead()
    expect(await repo.validateHead()).toBe(headB)
    release(new Response(null, { status: 304 }))
    expect(await earlier).toBe(headA)
    expect(await repo.validateHead()).toBe(headB)
    expect(validators).toEqual([null, '"a"', '"a"', '"b"'])
  })

  test.each([
    304, 403, 404,
  ])('fails closed on a cold ref response of %s', async (status) => {
    const repo = createGitHubAggregateRepository(
      config,
      async () => new Response(null, { status }),
    )
    await expect(repo.validateHead()).rejects.toBeInstanceOf(StorageError)
  })
})

describe('GitHub single-document persistence', () => {
  const file = (content: string) => ({
    type: 'file', encoding: 'base64', sha: blob, path: 'storage/editor/notes.json',
    size: Buffer.byteLength(content), content: Buffer.from(content).toString('base64'),
  })

  test('accepts an empty file but rejects incomplete bytes', async () => {
    const empty = createGitHubDocumentRepository(config, async () => Response.json(file('')))
    expect((await empty.loadText('editor/notes.json'))?.content).toBe('')
    const corrupt = createGitHubDocumentRepository(config, async () =>
      Response.json({ ...file('notes'), size: 99 }))
    await expect(corrupt.loadText('editor/notes.json')).rejects.toBeInstanceOf(StorageError)
  })

  test('rejects stale versions before writing and preserves blob compare-and-swap', async () => {
    let writes = 0
    const repo = createGitHubDocumentRepository(config, async (_url, init) => {
      if (init?.method === 'PUT') {
        writes++
        expect(JSON.parse(String(init.body))).toEqual({
          branch: config.branch, content: Buffer.from('next').toString('base64'),
          message: 'Update editor/notes.json', sha: blob,
        })
        return new Response(null, { status: 409 })
      }
      return Response.json(file('current\n'))
    })
    await expect(repo.saveText('editor/notes.json', 'next', {
      expectedVersion: createContentVersion('stale'),
    })).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(writes).toBe(0)
    await expect(repo.saveText('editor/notes.json', 'next', {
      expectedVersion: createContentVersion('current'),
    })).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(writes).toBe(1)
  })

  test('does not misclassify an ambiguous write as a conflict', async () => {
    const repo = createGitHubDocumentRepository(config, async (_url, init) => {
      if (init?.method === 'PUT') throw new TypeError('lost response')
      return Response.json(file('current'))
    })
    await expect(repo.saveText('editor/notes.json', 'next'))
      .rejects.toBeInstanceOf(StorageDocumentWriteUncertainError)
  })

  test('rejects truncated listings and does not cross the directory boundary', async () => {
    const entries = ['storage/scraps/a', 'storage/scraps-other/b'].map(path => ({
      path, sha: blob, mode: '100644', type: 'blob',
    }))
    const complete = createGitHubDocumentRepository(config, async () =>
      Response.json({ truncated: false, tree: entries }))
    expect(await complete.list('scraps/')).toEqual(['scraps/a'])
    const truncated = createGitHubDocumentRepository(config, async () =>
      Response.json({ truncated: true, tree: entries }))
    await expect(truncated.list('scraps/')).rejects.toBeInstanceOf(StorageError)
  })
})
