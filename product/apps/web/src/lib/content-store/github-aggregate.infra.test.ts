import { describe, expect, test } from 'bun:test'
import { createGitHubAggregateRepository } from './github-aggregate.infra'
import {
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './content-store.domain'

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
})
