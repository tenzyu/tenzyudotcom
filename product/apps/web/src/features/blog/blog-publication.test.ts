import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { confirmBlogPublication } from '@/features/blog/editor/blog-save-form-state'
import {
  parseBlogIndex,
  projectBlogIndexEntry,
} from './blog-index.assemble'
import {
  assembleBlogPostPageData,
  loadBlogPosts,
} from './blog.assemble'
import type {
  BlogChanges,
  BlogRenameCommand,
  BlogSaveCommand,
} from '@tenzyu/publishing-domain/blog'
import {
  loadBlogPostForEdit,
  reconcileBlogPublication,
  refreshBlogPublication,
  renameBlogPost,
  saveBlogPost,
} from './blog.infra'
import { readBlogSource } from './blog-source.assemble'
import { auditBlogProjection } from '../../../../../../repo-ops/acceptance/audit-blog-projection'
import { initGitContentFixture } from '../../../../../../repo-ops/acceptance/git-content-fixture.mjs'
import {
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from '@tenzyu/revisioned-content/contracts'
import { createGitHubAggregateRepository } from '@tenzyu/revisioned-content/github'

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

function rename(
  expectedVersion: string,
  newSlug: string,
  oldSlug = 'first',
): BlogRenameCommand {
  return { oldSlug, newSlug, expectedVersion }
}

function changedLeafPaths(
  git: ReturnType<typeof fixture>,
  before: string,
  after: string,
) {
  function leaves(ref: string) {
    return new Map(
      git
        .listing(ref)
        ?.filter(({ type }) => type !== 'tree')
        .map(({ path, sha, mode }) => [path, `${mode} ${sha}`]),
    )
  }
  const previous = leaves(before)
  const current = leaves(after)
  return [...new Set([...previous.keys(), ...current.keys()])]
    .filter((path) => previous.get(path) !== current.get(path))
    .sort()
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

describe('blog catalog addresses', () => {
  test('aliases resolve ahead of a legacy fallback and reserve the slug on create', async () => {
    const git = fixture({
      ...seed,
      [index]: serialize([{ ...summary, aliases: ['old'] }]),
      [post('old')]: original.replace('First post', 'Unlisted post'),
      [post('legacy')]: original.replace('First post', 'Legacy post'),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const snapshot = await repo.snapshot()

    expect(await assembleBlogPostPageData(snapshot, 'old')).toEqual({
      kind: 'redirect',
      slug: 'first',
    })
    expect(await assembleBlogPostPageData(snapshot, 'legacy')).toMatchObject({
      kind: 'post',
      post: { slug: 'legacy', metadata: { title: 'Legacy post' } },
    })
    expect((await loadBlogPosts(snapshot)).map(({ slug }) => slug)).toEqual([
      'first',
    ])

    for (const slug of ['first', 'old']) {
      await expect(saveBlogPost(create(slug), repo)).rejects.toBeInstanceOf(
        StorageVersionConflictError,
      )
    }
    expect(git.history()).toEqual([initial])
  })

  test('a canonical address still opens if another entry claims it as an alias', async () => {
    const git = fixture({
      ...seed,
      [index]: serialize([
        { ...summary, aliases: ['second'] },
        { ...summary, slug: 'second', pathname: 'blog/second.mdx' },
      ]),
      [post('second')]: original.replace('First post', 'Second post'),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const snapshot = await repo.snapshot()

    expect(await assembleBlogPostPageData(snapshot, 'second')).toMatchObject({
      kind: 'post',
      post: { slug: 'second', metadata: { title: 'Second post' } },
    })
    await expect(saveBlogPost(create('third'), repo)).rejects.toThrow(
      'conflicts with a canonical slug',
    )
    expect(git.history()).toEqual([initial])
  })

  test.each([
    [
      'canonical slug',
      { slug: 'first', pathname: 'blog/second.mdx' },
      ['third'],
    ],
    [
      'pathname',
      { slug: 'second', pathname: 'blog/first.mdx' },
      ['first', 'second', 'third'],
    ],
    [
      'alias',
      { slug: 'second', pathname: 'blog/second.mdx', aliases: ['old'] },
      ['first', 'second', 'third'],
    ],
  ] as const)('reports a duplicate %s and keeps safe catalog entries available', async (kind, duplicate, visible) => {
    const git = fixture({
      ...seed,
      [post('third')]: original.replace('First post', 'Third post'),
      [index]: serialize([
        { ...summary, aliases: ['old'] },
        { ...summary, ...duplicate },
        { ...summary, slug: 'third', pathname: 'blog/third.mdx' },
      ]),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const snapshot = await repo.snapshot()

    expect((await loadBlogPosts(snapshot)).map(({ slug }) => slug)).toEqual([
      ...visible,
    ])
    expect(await assembleBlogPostPageData(snapshot, 'third')).toMatchObject({
      kind: 'post',
      post: { slug: 'third', metadata: { title: 'Third post' } },
    })
    if (kind !== 'pathname') {
      await expect(assembleBlogPostPageData(snapshot, 'old')).rejects.toThrow(
        'ambiguous catalog ownership',
      )
    }
    await expect(saveBlogPost(create('fourth'), repo)).rejects.toThrow(
      `duplicate ${kind}`,
    )
    expect(git.history()).toEqual([initial])
  })
})

describe('blog rename using real Git trees and non-forced refs', () => {
  test('moves the exact indexed blob twice, keeping earlier addresses and unrelated files', async () => {
    const actualSource = 'storage/blog/nested/actual-source.mdx'
    const authoredLink = '\n[First post](/blog/first)\n'
    const scrap = 'storage/scraps/example/manifest.json'
    const related = { ...summary, slug: 'other', pathname: 'blog/other.mdx' }
    const git = fixture({
      ...seed,
      [actualSource]: original,
      [post('first')]: 'Unlisted file at the guessed source pathname.\n',
      [post('other')]: original + authoredLink,
      [scrap]: '{"outcomes":[{"kind":"blog","slug":"first"}]}\n',
      [index]: serialize([
        { ...summary, pathname: 'blog/nested/actual-source.mdx' },
        related,
      ]),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const initialPost = await loadBlogPostForEdit('first', repo)
    expect(initialPost?.fullRawContent).toBe(original)
    const version = initialPost?.version ?? ''
    const first = await renameBlogPost(rename(version, 'second'), repo)
    const second = await renameBlogPost(
      rename(version, 'third', 'second'),
      repo,
    )

    expect(git.history()).toEqual([second.commitOid, first.commitOid, initial])
    expect(git.parents(first.commitOid)).toEqual([initial])
    expect(git.parents(second.commitOid)).toEqual([first.commitOid])
    expect(changedLeafPaths(git, initial, first.commitOid)).toEqual([
      index,
      actualSource,
      post('second'),
    ])
    expect(changedLeafPaths(git, first.commitOid, second.commitOid)).toEqual([
      index,
      post('second'),
      post('third'),
    ])
    for (const [head, path] of [
      [first.commitOid, post('second')],
      [second.commitOid, post('third')],
    ]) {
      expect(git.listing(head)?.find((entry) => entry.path === path)?.sha).toBe(
        version,
      )
      expect(git.file(head, path)).toEqual(Buffer.from(original))
      expect(git.file(head, post('other'))?.toString()).toEndWith(authoredLink)
      expect(git.file(head, scrap)?.toString()).toBe(
        '{"outcomes":[{"kind":"blog","slug":"first"}]}\n',
      )
    }
    expect(
      parseBlogIndex(git.file(second.commitOid, index)?.toString()),
    ).toEqual([
      {
        ...summary,
        slug: 'third',
        pathname: 'blog/third.mdx',
        aliases: ['first', 'second'],
      },
      related,
    ])
    const snapshot = await repo.snapshot()
    for (const oldSlug of ['first', 'second']) {
      expect(await assembleBlogPostPageData(snapshot, oldSlug)).toEqual({
        kind: 'redirect',
        slug: 'third',
      })
      await expect(saveBlogPost(create(oldSlug), repo)).rejects.toBeInstanceOf(
        StorageVersionConflictError,
      )
    }
    expect((await loadBlogPosts(snapshot)).map(({ slug }) => slug)).toEqual([
      'third',
      'other',
    ])
    expect(git.head()).toBe(second.commitOid)
  })

  test('same slug checks the source version without a write, and an already correct path only changes the index', async () => {
    const git = fixture({
      [post('second')]: original,
      [index]: serialize([{ ...summary, pathname: 'blog/second.mdx' }]),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = (await loadBlogPostForEdit('first', repo))?.version ?? ''
    await expect(
      renameBlogPost(rename('a'.repeat(40), 'first'), repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(await renameBlogPost(rename(version, 'first'), repo)).toEqual({
      commitOid: initial,
      headOid: initial,
      status: 'unchanged',
    })
    expect(git.history()).toEqual([initial])

    const moved = await renameBlogPost(rename(version, 'second'), repo)
    expect(changedLeafPaths(git, initial, moved.commitOid)).toEqual([index])
    expect(await loadBlogPostForEdit('first', repo)).toMatchObject({
      slug: 'second',
      version,
    })
  })

  test.each([
    ['invalid destination slug', 'Wrong slug', [], {}, 'Invalid blog slug'],
    [
      'canonical destination',
      'second',
      [{ slug: 'second', pathname: 'blog/nested/other.mdx' }],
      {},
      'already in use',
    ],
    [
      'alias destination',
      'second',
      [{ slug: 'other', pathname: 'blog/other.mdx', aliases: ['second'] }],
      {},
      'already in use',
    ],
    [
      'indexed destination path',
      'second',
      [{ slug: 'other', pathname: 'blog/second.mdx' }],
      {},
      'owns this pathname',
    ],
    [
      'indexed descendant of the destination',
      'second',
      [{ slug: 'other', pathname: 'blog/second.mdx/child.mdx' }],
      {},
      'owns this pathname',
    ],
    [
      'unlisted destination file',
      'second',
      [],
      { [post('second')]: original },
      'unlisted blog file',
    ],
    [
      'unlisted destination directory',
      'second',
      [],
      { 'storage/blog/second.mdx/child.mdx': original },
      'unlisted blog file or directory',
    ],
    [
      'ambiguous source path',
      'second',
      [{ slug: 'other' }],
      {},
      'duplicate pathname',
    ],
    [
      'ambiguous source slug',
      'second',
      [{ pathname: 'blog/other.mdx' }],
      {},
      'duplicate canonical slug',
    ],
    [
      'ambiguous alias ownership',
      'second',
      [{ slug: 'other', pathname: 'blog/other.mdx', aliases: ['prior'] }],
      {},
      'duplicate alias',
    ],
  ] as const)('refuses a rename with %s', async (_name, nextSlug, extras, files, message) => {
    const git = fixture({
      ...seed,
      ...files,
      [index]: serialize([
        { ...summary, aliases: ['prior'] },
        ...extras.map((entry) => ({ ...summary, ...entry })),
      ]),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    await expect(
      renameBlogPost(rename(await initialVersion(repo), nextSlug), repo),
    ).rejects.toThrow(message)
    expect(git.history()).toEqual([initial])
  })

  test('refuses an alias, an unlisted file, and a missing body as the source', async () => {
    const git = fixture({
      [post('unlisted')]: original,
      [index]: serialize([{ ...summary, aliases: ['prior'] }]),
    })
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = 'a'.repeat(40)
    for (const slug of ['prior', 'unlisted']) {
      await expect(
        renameBlogPost(rename(version, 'next', slug), repo),
      ).rejects.toBeInstanceOf(StorageVersionConflictError)
    }
    await expect(renameBlogPost(rename(version, 'next'), repo)).rejects.toThrow(
      'indexed blog source is missing',
    )
    expect(git.history()).toEqual([initial])
  })

  test('an edit that wins the ref race invalidates the version held by a rename', async () => {
    const git = fixture()
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = await initialVersion(repo)
    const race = racingRepo(git)
    const losingRename = renameBlogPost(rename(version, 'next'), race.repo)
    await race.ready.wait
    const winner = await saveBlogPost(
      edit(version, { title: 'Winning edit' }),
      repo,
    )
    race.release.open()
    await expect(losingRename).rejects.toBeInstanceOf(
      StorageVersionConflictError,
    )
    await expect(renameBlogPost(rename(version, 'next'), repo)).rejects.toThrow(
      'This blog post changed',
    )
    expect(git.history()).toEqual([winner.commitOid, initial])
    expect(await loadBlogPostForEdit('first', repo)).toMatchObject({
      metadata: { title: 'Winning edit' },
    })
    expectTree(git, git.head(), ['first'])
  })

  test('a rename that wins the ref race keeps its destination and reserves the old address', async () => {
    const git = fixture()
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = await initialVersion(repo)
    const race = racingRepo(git)
    const losingCreate = saveBlogPost(create('next'), race.repo)
    await race.ready.wait
    const winner = await renameBlogPost(rename(version, 'next'), repo)
    race.release.open()
    await expect(losingCreate).rejects.toBeInstanceOf(
      StorageVersionConflictError,
    )
    await expect(saveBlogPost(create('next'), repo)).rejects.toBeInstanceOf(
      StorageVersionConflictError,
    )
    await expect(
      saveBlogPost(edit(version, { title: 'Old form' }), repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(git.history()).toEqual([winner.commitOid, initial])
    expectTree(git, git.head(), ['next'])
  })

  test.each([
    false,
    true,
  ])('reconciles a lost ref response with applied=%s and returns a fresh view only after acceptance', async (applied) => {
    const git = fixture()
    const initial = git.head()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const version = await initialVersion(repo)
    const lost = createGitHubAggregateRepository(config, async (url, init) => {
      if (init?.method !== 'PATCH') return git.fetch(url, init)
      if (applied) await git.fetch(url, init)
      throw new TypeError('Fixture lost the rename response')
    })
    const error = await renameBlogPost(rename(version, 'next'), lost).catch(
      (failure: unknown) => failure,
    )
    if (!(error instanceof StorageCommitUncertainError))
      throw new Error('Missing uncertain candidate')
    const { candidateOid } = error
    expect(git.parents(candidateOid)).toEqual([initial])
    expectTree(git, candidateOid, ['next'])
    if (!applied) {
      expect(
        await reconcileBlogPublication({ slug: 'next', candidateOid }, repo),
      ).toBeNull()
      expect(git.history()).toEqual([initial])
      expectTree(git, git.head(), ['first'])
      return
    }

    const laterRename = await renameBlogPost(
      rename(version, 'latest', 'next'),
      repo,
    )
    const laterEdit = await saveBlogPost(
      edit(version, { body: 'Latest body.  \r\n' }, 'latest'),
      repo,
    )
    const result = await reconcileBlogPublication(
      { slug: 'next', candidateOid },
      repo,
    )
    const actual = git
      .listing(laterEdit.commitOid)
      ?.find(({ path }) => path === post('latest'))
    expect(result).toMatchObject({
      receipt: {
        commitOid: candidateOid,
        headOid: laterEdit.commitOid,
        status: 'reconciled',
      },
      view: {
        status: 'ready',
        post: {
          slug: 'latest',
          rawContent: 'Latest body.  \r\n',
          version: actual?.sha,
        },
      },
    })
    expect(git.history()).toEqual([
      laterEdit.commitOid,
      laterRename.commitOid,
      candidateOid,
      initial,
    ])
  })

  test('refreshes only the selected body and gives two successive saves their own edit version', async () => {
    const git = fixture()
    const repo = createGitHubAggregateRepository(config, git.fetch)
    const unrelated = await saveBlogPost(create('unrelated'), repo)
    const selected = await saveBlogPost(create('selected'), repo)
    const reads: string[] = []
    let readFailure = true
    const editor = createGitHubAggregateRepository(
      config,
      async (url, init) => {
        const { pathname } = new URL(url)
        if (pathname.includes('/contents/'))
          reads.push(pathname.split('/contents/')[1])
        if (readFailure && pathname.endsWith('/blog/selected.mdx'))
          return new Response(null, { status: 503 })
        return git.fetch(url, init)
      },
    )
    expect(
      await refreshBlogPublication(
        { slug: 'selected', receipt: selected },
        editor,
      ),
    ).toEqual({
      receipt: selected,
      view: { status: 'unavailable' },
    })
    expect(git.history().slice(0, 2)).toEqual([
      selected.commitOid,
      unrelated.commitOid,
    ])
    readFailure = false
    reads.length = 0
    const before = await loadBlogPostForEdit('selected', editor)
    expect(reads).toEqual([index, post('selected')])
    expect(before?.metadata.title).toBe('selected')

    const first = await saveBlogPost(
      edit(before?.version ?? '', { title: 'First edit' }, 'selected'),
      repo,
    )
    const refreshed = await refreshBlogPublication(
      { slug: 'selected', receipt: first },
      repo,
    )
    if (refreshed.view.status !== 'ready')
      throw new Error('Missing current editor view')
    expect(refreshed.view.post.metadata.title).toBe('First edit')
    expect(refreshed.view.post.version).not.toBe(before?.version)
    const second = await saveBlogPost(
      edit(
        refreshed.view.post.version,
        { body: 'Second edit.  \r\n' },
        'selected',
      ),
      repo,
    )
    expect(git.parents(second.commitOid)).toEqual([first.commitOid])
    expect(await loadBlogPostForEdit('selected', repo)).toMatchObject({
      metadata: { title: 'First edit' },
      rawContent: 'Second edit.  \r\n',
    })
  })
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
