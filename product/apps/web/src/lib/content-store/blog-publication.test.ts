import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { confirmBlogPublication } from '@/app/[locale]/(admin)/editor/_features/blog-save-form-state'
import {
  parseBlogIndex,
  projectBlogIndexEntry,
} from '@/app/[locale]/(main)/blog/_features/blog-index.assemble'
import type {
  BlogChanges,
  BlogSaveCommand,
} from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { saveBlogPost } from '@/app/[locale]/(main)/blog/_features/blog.infra'
import { readBlogSource } from '@/app/[locale]/(main)/blog/_features/blog-source.assemble'
import { auditBlogProjection } from '../../../../../../repo-ops/renewal/audit-blog-projection'
import { initGitContentFixture } from '../../../../../../repo-ops/renewal/git-content-fixture.mjs'
import {
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from './content-store.domain'
import { createGitHubAggregateRepository } from './github-aggregate.infra'

const config = {
  owner: 'fixture',
  repo: 'editor',
  branch: 'main',
  root: 'storage',
}
const index = 'storage/blog/index.json'
const paths: string[] = []
const post = (slug: string) => `storage/blog/${slug}.mdx`
const date = '2026-03-26T03:01:27.139Z'
const crlfBody =
  'A markdown body.  \r\n\r\n| A | B |\r\n| - | - |\r\n| 1 | 2 |\r\n\r\n<KoFiLink />\r\n'
const originalHeader = [
  '---',
  '# Author comment',
  'title: "First post" # title comment',
  'summary: >- # summary comment',
  '  Seed article.',
  'publishedAt: 2026-03-26T12:01:27.139+09:00 # precise timestamp',
  'updatedAt: 2026-03-26T12:02:37.981+09:00',
  'image: /fixture-cover.png',
  'tags:',
  '- last # label comment',
  '- first',
  'authorExtras: {enabled: true, aliases: [one, two]}',
  '---',
  '',
].join('\r\n')
const original = originalHeader + crlfBody
const summary = {
  slug: 'first',
  pathname: 'blog/first.mdx',
  origin: 'fixture',
  metadata: {
    title: 'First post',
    summary: 'Seed article.',
    publishedAt: date,
    updatedAt: '2026-03-26T03:02:37.981Z',
    image: '/fixture-cover.png',
    tags: ['last', 'first'],
    unrelated: { visible: true },
  },
}
const serialize = (entries: unknown) => `${JSON.stringify(entries, null, 2)}\n`
const seed = {
  [post('first')]: original,
  [index]: serialize([summary]),
  'storage/editor/notes.json': '[]\n',
}

function fixture(files: Record<string, string> = seed) {
  const dir = mkdtempSync(join(tmpdir(), 'blog-git-'))
  paths.push(dir)
  return initGitContentFixture(join(dir, 'fixture.git'), files)
}

function create(slug: string, title = slug): BlogSaveCommand {
  return {
    intent: 'create',
    slug,
    changes: {
      title,
      summary: 'Fixture summary',
      publishedAt: date,
      body: `**${title}**  \n\n<KoFiLink />\n`,
    },
  }
}

function edit(
  expectedVersion: string,
  changes: BlogChanges,
  slug = 'first',
): BlogSaveCommand {
  return { intent: 'edit', slug, expectedVersion, changes }
}

async function initialVersion(
  repo: ReturnType<typeof createGitHubAggregateRepository>,
) {
  const file = await (await repo.snapshot()).loadText('blog/first.mdx')
  return file?.version ?? ''
}

function gate() {
  let open!: () => void
  const wait = new Promise<void>((resolve) => {
    open = resolve
  })
  return { wait, open }
}

function racingRepo(git: ReturnType<typeof fixture>) {
  const ready = gate()
  const release = gate()
  const repo = createGitHubAggregateRepository(config, async (url, init) => {
    if (init?.method === 'PATCH') {
      ready.open()
      await release.wait
    }
    return git.fetch(url, init)
  })
  return { repo, ready, release }
}

function expectTree(
  git: ReturnType<typeof fixture>,
  head: string,
  slugs: string[],
) {
  const entries = parseBlogIndex(git.file(head, index)?.toString())
  expect(entries.map(({ slug }) => slug).sort()).toEqual([...slugs].sort())
  expect(
    git
      .listing(head)
      ?.filter(
        ({ path }) => path.startsWith('storage/blog/') && path.endsWith('.mdx'),
      )
      .map(({ path }) => path)
      .sort(),
  ).toEqual(slugs.map(post).sort())
  for (const entry of entries) {
    const source = git.file(head, `storage/${entry.pathname}`)
    if (!source) throw new Error('Index referenced a missing blog body')
    const actual = readBlogSource(source.toString(), entry.pathname)
    expect(
      projectBlogIndexEntry(entry.slug, entry.pathname, actual.metadata, entry),
    ).toEqual(entry)
  }
}

afterEach(() => {
  for (const dir of paths.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

describe('blog publication using real Git trees and non-forced refs', () => {
  test('create/create against one slug publishes one complete commit and allows reload', async () => {
    const git = fixture()
    const initial = git.head()
    const race = racingRepo(git)
    const loser = saveBlogPost(
      create('second', 'First submitted draft'),
      race.repo,
    )
    await race.ready.wait
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const winner = await saveBlogPost(create('second', 'Other draft'), repo)
    race.release.open()
    await expect(loser).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(git.history()).toEqual([winner.commitOid, initial])
    expect(git.parents(winner.commitOid)).toEqual([initial])
    expectTree(git, initial, ['first'])
    expectTree(git, winner.commitOid, ['first', 'second'])
    const current = await (await repo.snapshot()).loadText('blog/second.mdx')
    const retried = await saveBlogPost(
      edit(
        current?.version ?? '',
        { title: 'First submitted draft' },
        'second',
      ),
      repo,
    )
    expect(git.parents(retried.commitOid)).toEqual([winner.commitOid])
    expectTree(git, retried.commitOid, ['first', 'second'])
  })

  test('edit/edit conflicts for the same blob and for a trailing-whitespace edit', async () => {
    const git = fixture()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = await initialVersion(repo)
    const race = racingRepo(git)
    const loser = saveBlogPost(
      edit(version, { title: 'Stale form' }),
      race.repo,
    )
    await race.ready.wait
    const winner = await saveBlogPost(
      edit(version, { body: crlfBody + '  ' }),
      repo,
    )
    race.release.open()
    await expect(loser).rejects.toBeInstanceOf(StorageVersionConflictError)
    await expect(
      saveBlogPost(edit(version, { title: 'Stale form' }), repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    const retried = await saveBlogPost(
      edit(await initialVersion(repo), { title: 'Reapplied draft' }),
      repo,
    )
    expect(git.file(retried.commitOid, post('first'))?.toString()).toEndWith(
      crlfBody + '  ',
    )
    expect(git.history()).toHaveLength(3)
    expect(git.parents(retried.commitOid)).toEqual([winner.commitOid])
    for (const sha of git.history()) expectTree(git, sha, ['first'])
  })

  test('a competing unrelated change survives two distinct blog publications after retry', async () => {
    const git = fixture()
    const race = racingRepo(git)
    const loser = saveBlogPost(create('second'), race.repo)
    const initial = git.head()
    await race.ready.wait
    const direct = git.advance(
      { 'storage/editor/notes.json': '[{"fixture":true}]\n' },
      'Write unrelated notes',
    )
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const third = await saveBlogPost(create('third'), repo)
    race.release.open()
    await expect(loser).rejects.toBeInstanceOf(StorageVersionConflictError)
    const second = await saveBlogPost(create('second'), repo)
    expect(git.history()).toEqual([
      second.commitOid,
      third.commitOid,
      direct,
      initial,
    ])
    expectTree(git, initial, ['first'])
    expectTree(git, direct, ['first'])
    expectTree(git, third.commitOid, ['first', 'third'])
    expectTree(git, second.commitOid, ['first', 'second', 'third'])
    expect(git.file(git.head(), 'storage/editor/notes.json')?.toString()).toBe(
      '[{"fixture":true}]\n',
    )
  })

  test.each([
    'tree',
    'commit',
    'rejected ref',
    'lost before ref',
    'lost after ref',
  ] as const)('keeps the branch consistent after %s', async (failure) => {
    const git = fixture()
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, async (url, init) => {
      const endpoint = new URL(url).pathname
      if (
        init?.method === 'POST' &&
        ((failure === 'tree' && endpoint.endsWith('/trees')) ||
          (failure === 'commit' && endpoint.endsWith('/commits')))
      )
        return new Response(null, { status: 503 })
      if (init?.method === 'PATCH') {
        if (failure === 'rejected ref')
          return new Response(null, { status: 422 })
        if (failure === 'lost after ref') await git.fetch(url, init)
        if (failure.startsWith('lost'))
          throw new TypeError('Fixture lost the response')
      }
      return git.fetch(url, init)
    })
    const result = await saveBlogPost(create('second'), repo).catch(
      (error: unknown) => error,
    )
    if (failure.startsWith('lost')) {
      expect(result).toBeInstanceOf(StorageCommitUncertainError)
      if (!(result instanceof StorageCommitUncertainError))
        throw new Error('Missing candidate')
      const oid = result.candidateOid
      expect(git.parents(oid)).toEqual([initial])
      expectTree(git, oid, ['first', 'second'])
      if (failure === 'lost after ref') {
        expect(git.history()).toEqual([oid, initial])
        expect(await repo.reconcile(oid)).toBe(oid)
        const later = git.advance(
          { 'storage/editor/notes.json': '[1]\n' },
          'Advance unrelated notes',
        )
        expect(await repo.reconcile(oid)).toBe(later)
        const checked = confirmBlogPublication(
          { commitOid: oid, headOid: later, status: 'reconciled' },
          () => {},
        )
        expect(checked).toMatchObject({
          status: 'saved',
          receipt: { commitOid: oid, headOid: later },
        })
        expectTree(git, later, ['first', 'second'])
      } else {
        expect(await repo.reconcile(oid)).toBeNull()
        expect(git.isAncestor(oid, git.head())).toBe(false)
        expect(git.history()).toEqual([initial])
      }
    } else {
      expect(result).toBeInstanceOf(
        failure === 'rejected ref' ? StorageVersionConflictError : StorageError,
      )
      expect(git.history()).toEqual([initial])
    }
    expectTree(git, initial, ['first'])
  })

  test('returns a receipt after cache refresh fails without a second ref update', async () => {
    const git = fixture()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const initial = git.head()
    const receipt = await saveBlogPost(create('second'), repo)
    const state = confirmBlogPublication(receipt, () => {
      throw new Error('Fixture cache failure')
    })
    expect(state).toMatchObject({
      status: 'saved',
      receipt,
      refreshPending: true,
      message: 'Saved. Refresh pending.',
    })
    expect(git.history()).toEqual([receipt.commitOid, initial])
    expectTree(git, receipt.commitOid, ['first', 'second'])
  })

  test('retains the full YAML block for body edits and preserves CRLF bytes for field edits', async () => {
    const git = fixture()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const initial = git.head()
    const noop = await saveBlogPost(edit(await initialVersion(repo), {}), repo)
    expect(noop).toEqual({
      commitOid: initial,
      headOid: initial,
      status: 'unchanged',
    })
    expect(git.history()).toEqual([initial])
    const changed = await saveBlogPost(
      edit(await initialVersion(repo), {
        title: 'New title',
        summary: 'New summary',
        updatedAt: null,
        tags: ['first', 'last'],
      }),
      repo,
    )
    const revised = git.file(changed.commitOid, post('first'))?.toString() ?? ''
    const source = readBlogSource(revised, 'blog/first.mdx')
    expect(source.content).toBe(crlfBody)
    expect(revised).toContain('title: "New title" # title comment\r\n')
    expect(revised).toContain('# summary comment\r\n')
    expect(revised).toContain('# label comment\r\n')
    expect(revised).toContain(
      'publishedAt: 2026-03-26T12:01:27.139+09:00 # precise timestamp\r\n',
    )
    expect(revised).toContain(
      'authorExtras: {enabled: true, aliases: [one, two]}\r\n',
    )
    expect(source.metadata).toMatchObject({
      title: 'New title',
      image: '/fixture-cover.png',
      tags: ['first', 'last'],
    })
    expect(source.metadata.updatedAt).toBeUndefined()
    expect(
      parseBlogIndex(git.file(git.head(), index)?.toString())[0],
    ).toMatchObject({
      origin: 'fixture',
      metadata: { unrelated: { visible: true }, publishedAt: date },
    })
    const bodyOnly = await saveBlogPost(
      edit(await initialVersion(repo), { body: crlfBody + 'A new line.  \n' }),
      repo,
    )
    expect(git.file(bodyOnly.commitOid, post('first'))?.toString()).toBe(
      revised + 'A new line.  \n',
    )
    expect(git.file(bodyOnly.commitOid, index)).toEqual(
      git.file(changed.commitOid, index),
    )
    expectTree(git, bodyOnly.commitOid, ['first'])
  })

  test('bootstraps an absent index only from a complete pinned tree without blog posts', async () => {
    const git = fixture({ 'storage/empty.txt': '' })
    const repo = createGitHubAggregateRepository(config, git.fetch)
    expect(await (await repo.snapshot()).loadText('empty.txt')).toMatchObject({
      content: '',
    })
    const receipt = await saveBlogPost(create('new'), repo)
    expectTree(git, receipt.commitOid, ['new'])
  })

  test('dry audit reports unlisted bodies, missing indexed bodies and metadata drift', () => {
    const git = fixture({
      [post('first')]: original,
      [post('orphan')]: original,
      [index]: serialize([
        {
          ...summary,
          metadata: { ...summary.metadata, title: 'Old projected title' },
        },
        { ...summary, slug: 'missing', pathname: 'blog/missing.mdx' },
      ]),
    })
    const initial = git.head()
    expect(auditBlogProjection(git, initial)).toEqual([
      { path: 'blog/first.mdx', reason: 'metadata-drift' },
      { path: 'blog/missing.mdx', reason: 'missing-body' },
      { path: 'blog/orphan.mdx', reason: 'unlisted-body' },
    ])
    expect(git.history()).toEqual([initial])
  })

  test.each([
    ['malformed index', { [index]: 'invalid' }, 'index is invalid'],
    [
      'duplicate slug',
      {
        [index]: serialize([
          summary,
          { ...summary, pathname: 'blog/other.mdx' },
        ]),
      },
      'duplicate',
    ],
    [
      'duplicate pathname',
      { [index]: serialize([summary, { ...summary, slug: 'other' }]) },
      'duplicate',
    ],
    [
      'competing pathname',
      { [index]: serialize([{ ...summary, pathname: 'blog/new.mdx' }]) },
      'owns this pathname',
    ],
    [
      'orphan body',
      { [index]: '[]\n', [post('new')]: original },
      'unlisted blog post',
    ],
    ['missing index', { [post('first')]: original }, 'index is missing'],
  ] as const)('refuses to publish over %s and leaves its dry inventory intact', async (_name, files, message) => {
    const git = fixture(files)
    const initial = git.head()
    const inventory = git.listing(initial)
    const repo = createGitHubAggregateRepository(config, git.fetch)
    await expect(saveBlogPost(create('new'), repo)).rejects.toThrow(message)
    expect(git.history()).toEqual([initial])
    expect(git.listing(git.head())).toEqual(inventory)
  })

  test.each([
    'missing tree',
    'truncated tree',
    'incomplete body',
    'missing OID',
  ] as const)('rejects inconclusive proof from %s', async (failure) => {
    const treeFailure = failure.endsWith('tree')
    const git = fixture(treeFailure ? { 'storage/empty.txt': '' } : seed)
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, async (url, init) => {
      const path = new URL(url).pathname
      if (path.includes('/git/trees/') && treeFailure) {
        return failure === 'missing tree'
          ? new Response(null, { status: 404 })
          : Response.json({ truncated: true, tree: [] })
      }
      if (path.endsWith('/blog/first.mdx'))
        return Response.json({
          type: 'file',
          encoding: failure === 'incomplete body' ? 'none' : 'base64',
          size: original.length,
          content: '',
          sha: failure === 'incomplete body' ? 'a'.repeat(40) : undefined,
        })
      return git.fetch(url, init)
    })
    const command = treeFailure
      ? create('new')
      : edit('a'.repeat(40), { title: 'Draft' })
    await expect(saveBlogPost(command, repo)).rejects.toBeInstanceOf(
      StorageError,
    )
    expect(git.history()).toEqual([initial])
  })

  test('fails a missing indexed target and an edit that would change an unrelated alias', async () => {
    const git = fixture({ [index]: serialize([summary]) })
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const initial = git.head()
    await expect(
      saveBlogPost(edit('a'.repeat(40), { title: 'New title' }), repo),
    ).rejects.toThrow('indexed blog post is missing')
    expect(git.history()).toEqual([initial])
    const source = original
      .replace('title: "First post"', 'title: &shared "First post"')
      .replace(
        'authorExtras: {enabled: true, aliases: [one, two]}',
        'authorExtras: *shared',
      )
    const head = git.advance({ [post('first')]: source }, 'Seed aliased fields')
    await expect(
      saveBlogPost(
        edit(await initialVersion(repo), { title: 'Edit title' }),
        repo,
      ),
    ).rejects.toThrow('edited safely')
    expect(git.history()).toEqual([head, initial])
  })
})
