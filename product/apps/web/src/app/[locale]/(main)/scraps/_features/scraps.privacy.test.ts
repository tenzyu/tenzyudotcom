import { afterEach, expect, test } from 'bun:test'
import {
  type AggregateContentRepository,
  type ContentSnapshot,
  type ContentWrite,
  StorageVersionConflictError,
} from '@/lib/content-store/content-store.domain'
import { executeScrapEditorCommand } from '@/features/content-editor/scrap-editor.assemble'
import type { ScrapEditorCommand } from '@/features/content-editor/scrap-editor.domain'
import { assembleScrapPage, loadPublicScraps } from './scraps.assemble'
import { getScrapStoragePaths } from './scraps.domain'
import { setScrapsRepositoryOverride } from './scraps.infra'
import { SCRAPS_INDEX_PATHNAME } from '@/lib/content-store/content-tags.infra'

class InterleavedRepository implements AggregateContentRepository {
  files = new Map<string, string>()
  revision = 0
  afterRead: ((pathname: string) => Promise<void>) | null = null

  async snapshot(): Promise<ContentSnapshot> {
    const files = new Map(this.files)
    return {
      version: String(this.revision),
      loadText: async (pathname) => {
        const content = files.get(pathname)
        await this.afterRead?.(pathname)
        return content === undefined ? null : { content }
      },
    }
  }

  async commit(version: string, writes: readonly ContentWrite[]) {
    if (version !== String(this.revision))
      throw new StorageVersionConflictError('conflict')
    const files = new Map(this.files)
    for (const write of writes) files.set(write.pathname, write.content)
    this.files = files
    return String(++this.revision)
  }

  install() {
    setScrapsRepositoryOverride({
      snapshot: () => this.snapshot(),
      commit: (version, writes) => this.commit(version, writes),
      loadText: async (pathname) => (await this.snapshot()).loadText(pathname),
      loadJson: async <T>(pathname: string): Promise<T | null> => {
        const file = await (await this.snapshot()).loadText(pathname)
        return file ? JSON.parse(file.content) : null
      },
      list: async () => [...this.files.keys()],
      saveText: async () => {
        throw new Error('Use aggregate commands')
      },
      saveJson: async () => {
        throw new Error('Use aggregate commands')
      },
      delete: async () => {
        throw new Error('Use aggregate commands')
      },
    })
  }

  interleave(path: string, update: () => Promise<unknown>) {
    this.afterRead = async (pathname) => {
      if (pathname !== path) return
      this.afterRead = null
      await update()
    }
  }
}

const create = {
  kind: 'create',
  slug: 'privacy-race',
  locale: 'ja',
  title: 'Public title',
  hypothesis: 'Public hypothesis',
  summary: '',
  tags: [],
  status: 'open',
  published: true,
  lead: 'Published lead',
} satisfies ScrapEditorCommand
const pageParams = {
  slug: create.slug,
  locale: 'ja',
  audience: 'public',
} as const
const paths = getScrapStoragePaths(create.slug)

afterEach(() => setScrapsRepositoryOverride(null))

test('public detail keeps the published snapshot when an update unpublishes and replaces the lead', async () => {
  const repo = new InterleavedRepository()
  const saved = await executeScrapEditorCommand(create, repo)
  repo.install()
  repo.interleave(paths.manifest, () =>
    executeScrapEditorCommand(
      {
        ...create,
        kind: 'update',
        expectedVersion: saved.version,
        published: false,
        lead: 'NEVER-PUBLISHED PRIVATE DRAFT',
      },
      repo,
    ),
  )

  const page = await assembleScrapPage(pageParams)
  expect(repo.revision).toBe(2)
  expect(page?.leadSource).toBe('Published lead')
  expect(page?.pageIsIndexable).toBe(true)
  expect(await assembleScrapPage(pageParams)).toBeNull()
  expect(await loadPublicScraps()).toEqual([])
})

test.each([
  paths.manifest,
  paths.entryMeta('one'),
])('public detail keeps published entry metadata and bodies across an edit after %s', async (pausePath) => {
  const repo = new InterleavedRepository()
  const created = await executeScrapEditorCommand(create, repo)
  const saved = await executeScrapEditorCommand(
    {
      kind: 'append',
      slug: create.slug,
      locale: 'ja',
      expectedVersion: created.version,
      entryId: 'one',
      entryKind: 'note',
      published: true,
      body: 'Published entry',
    },
    repo,
  )
  repo.install()
  repo.interleave(pausePath, () =>
    executeScrapEditorCommand(
      {
        kind: 'edit-entry',
        slug: create.slug,
        locale: 'ja',
        expectedVersion: saved.version,
        entryId: 'one',
        entryKind: 'note',
        published: false,
        body: 'NEVER-PUBLISHED PRIVATE ENTRY',
      },
      repo,
    ),
  )

  const page = await assembleScrapPage(pageParams)
  expect(repo.revision).toBe(3)
  expect(page?.entries[0]?.localizedSource).toBe('Published entry')
  expect(page?.leadSource).toBe('Published lead')
  expect(page?.pageIsIndexable).toBe(true)
  expect((await assembleScrapPage(pageParams))?.entries).toEqual([])
})

test('public index returns one published revision during an unpublish and hides the current draft', async () => {
  const repo = new InterleavedRepository()
  const saved = await executeScrapEditorCommand(create, repo)
  repo.install()
  repo.interleave(SCRAPS_INDEX_PATHNAME, () =>
    executeScrapEditorCommand(
      {
        ...create,
        kind: 'update',
        expectedVersion: saved.version,
        published: false,
        title: 'NEVER-PUBLISHED PRIVATE TITLE',
      },
      repo,
    ),
  )

  expect((await loadPublicScraps()).map((entry) => entry.title)).toEqual([
    'Public title',
  ])
  expect(repo.revision).toBe(2)
  expect(await loadPublicScraps()).toEqual([])
})
