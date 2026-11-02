import { describe, expect, test } from 'bun:test'
import {
  type AggregateContentRepository,
  type ContentWrite,
  StorageError,
  StorageVersionConflictError,
} from '@/lib/content-store/content-store.domain'
import {
  executeScrapEditorCommand,
  loadScrapEditorState,
  loadScrapEditorIndex,
} from './scrap-editor.assemble'
import type { ScrapEditorCommand } from './scrap-editor.validation'
import { setScrapsRepositoryOverride } from '@/features/scraps/scraps.infra'
import {
  assembleScrapPage,
  filterPublicScrapIndex,
} from '@/app/[locale]/(main)/scraps/_features/scraps.assemble'

class MemoryAggregate implements AggregateContentRepository {
  files = new Map<string, string>()
  revision = 0
  fail = false
  race = false
  async snapshot() {
    const files = new Map(this.files)
    return {
      version: String(this.revision),
      loadText: async (path: string) => {
        const content = files.get(path)
        return content === undefined ? null : { content }
      },
    }
  }
  async commit(version: string, writes: readonly ContentWrite[]) {
    if (this.race) this.revision++
    if (version !== String(this.revision))
      throw new StorageVersionConflictError('conflict')
    if (this.fail) throw new StorageError('injected pre-publication failure')
    const next = new Map(this.files)
    for (const write of writes) next.set(write.pathname, write.content)
    this.files = next
    return String(++this.revision)
  }
}

const create = {
  kind: 'create',
  slug: 'field-notes',
  locale: 'ja',
  title: 'Field notes',
  hypothesis: 'Try the idea',
  summary: '',
  tags: ['research'],
  status: 'open',
  published: false,
  lead: 'Original lead',
} satisfies ScrapEditorCommand

describe('scrap editor lifecycle', () => {
  test('create, append, edit, publish, close, archive retain documents and projection', async () => {
    const repo = new MemoryAggregate()
    let saved = await executeScrapEditorCommand(create, repo)
    expect((await loadScrapEditorIndex(repo))[0]?.published).toBe(false)
    saved = await executeScrapEditorCommand(
      {
        kind: 'append',
        slug: create.slug,
        locale: 'ja',
        expectedVersion: saved.version,
        entryId: 'first',
        entryKind: 'note',
        body: 'First draft',
        published: false,
      },
      repo,
    )
    saved = await executeScrapEditorCommand(
      {
        kind: 'edit-entry',
        slug: create.slug,
        locale: 'ja',
        expectedVersion: saved.version,
        entryId: 'first',
        entryKind: 'evidence',
        body: 'Revised entry',
        published: true,
      },
      repo,
    )
    saved = await executeScrapEditorCommand(
      {
        ...create,
        kind: 'update',
        title: 'Published research',
        tags: ['result'],
        lead: 'Revised lead',
        published: true,
        expectedVersion: saved.version,
      },
      repo,
    )
    const state = await loadScrapEditorState(create.slug, repo)
    expect(state?.manifest.title).toBe('Published research')
    expect(state?.lead[0]?.source).toBe('Revised lead')
    expect(state?.entries[0]?.documents[0]?.source).toBe('Revised entry')
    expect(state?.entries[0]?.meta).toMatchObject({
      kind: 'evidence',
      published: true,
    })
    expect((await loadScrapEditorIndex(repo))[0]).toMatchObject({
      published: true,
      entryCount: 1,
      tags: ['result'],
    })
    for (const status of ['closed', 'archived'] as const) {
      saved = await executeScrapEditorCommand(
        {
          ...create,
          kind: 'update',
          status,
          published: true,
          expectedVersion: saved.version,
        },
        repo,
      )
      expect((await loadScrapEditorIndex(repo))[0]?.status).toBe(status)
    }
  })

  test('stale versions, duplicate creates, races and failures leave every aggregate file intact', async () => {
    const repo = new MemoryAggregate()
    repo.fail = true
    await expect(
      executeScrapEditorCommand(create, repo),
    ).rejects.toBeInstanceOf(StorageError)
    expect(repo.files.size).toBe(0)
    repo.fail = false
    const saved = await executeScrapEditorCommand(create, repo)
    const before = [...repo.files]
    await expect(
      executeScrapEditorCommand(create, repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    const append = {
      kind: 'append',
      slug: create.slug,
      locale: 'ja',
      expectedVersion: saved.version,
      entryId: 'first',
      entryKind: 'note',
      body: 'Unsaved draft',
      published: false,
    } satisfies ScrapEditorCommand
    await expect(
      executeScrapEditorCommand({ ...append, expectedVersion: 'stale' }, repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    repo.fail = true
    await expect(
      executeScrapEditorCommand(append, repo),
    ).rejects.toBeInstanceOf(StorageError)
    expect([...repo.files]).toEqual(before)
    repo.fail = false
    repo.race = true
    await expect(
      executeScrapEditorCommand(append, repo),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect([...repo.files]).toEqual(before)
  })

  test('manual translations record the source version and become stale after source changes', async () => {
    const repo = new MemoryAggregate()
    let saved = await executeScrapEditorCommand(create, repo)
    saved = await executeScrapEditorCommand(
      {
        ...create,
        kind: 'update',
        locale: 'en',
        lead: 'English translation',
        expectedVersion: saved.version,
      },
      repo,
    )
    let state = await loadScrapEditorState(create.slug, repo)
    expect(state?.lead.find((ref) => ref.locale === 'en')).toMatchObject({
      state: 'manual',
      source: 'English translation',
    })
    saved = await executeScrapEditorCommand(
      {
        ...create,
        kind: 'update',
        lead: 'Changed source',
        expectedVersion: saved.version,
      },
      repo,
    )
    state = await loadScrapEditorState(create.slug, repo)
    expect(state?.lead.find((ref) => ref.locale === 'en')?.state).toBe('stale')
    expect((await loadScrapEditorIndex(repo))[0]?.indexableLocales).toEqual([
      'ja',
    ])
    saved = await executeScrapEditorCommand(
      {
        kind: 'append',
        slug: create.slug,
        locale: 'ja',
        entryId: 'one',
        entryKind: 'note',
        body: 'Source entry',
        published: true,
        expectedVersion: saved.version,
      },
      repo,
    )
    saved = await executeScrapEditorCommand(
      {
        kind: 'edit-entry',
        slug: create.slug,
        locale: 'en',
        entryId: 'one',
        entryKind: 'note',
        body: 'Translated entry',
        published: true,
        expectedVersion: saved.version,
      },
      repo,
    )
    saved = await executeScrapEditorCommand(
      {
        kind: 'edit-entry',
        slug: create.slug,
        locale: 'ja',
        entryId: 'one',
        entryKind: 'note',
        body: 'Changed entry',
        published: true,
        expectedVersion: saved.version,
      },
      repo,
    )
    state = await loadScrapEditorState(create.slug, repo)
    expect(
      state?.entries[0]?.documents.find((ref) => ref.locale === 'en')?.state,
    ).toBe('stale')
  })

  test('public readers see only published scraps and entries, with safe locale fallback', async () => {
    const repo = new MemoryAggregate()
    setScrapsRepositoryOverride({
      snapshot: () => repo.snapshot(),
      commit: (version, writes) => repo.commit(version, writes),
      async loadText(pathname) {
        return (await repo.snapshot()).loadText(pathname)
      },
      async loadJson<T>(pathname: string): Promise<T | null> {
        const file = repo.files.get(pathname)
        return file ? JSON.parse(file) : null
      },
      async saveText() {
        throw new Error('read only')
      },
      async saveJson() {
        throw new Error('read only')
      },
      async list() {
        return [...repo.files.keys()]
      },
      async delete() {
        throw new Error('read only')
      },
    })
    try {
      let saved = await executeScrapEditorCommand(create, repo)
      expect(
        await assembleScrapPage({
          slug: create.slug,
          locale: 'ja',
          audience: 'public',
        }),
      ).toBeNull()
      expect(filterPublicScrapIndex(await loadScrapEditorIndex(repo))).toEqual(
        [],
      )
      saved = await executeScrapEditorCommand(
        {
          ...create,
          kind: 'update',
          published: true,
          expectedVersion: saved.version,
        },
        repo,
      )
      saved = await executeScrapEditorCommand(
        {
          kind: 'append',
          slug: create.slug,
          locale: 'ja',
          entryId: 'draft',
          entryKind: 'note',
          published: false,
          body: 'Private entry',
          expectedVersion: saved.version,
        },
        repo,
      )
      expect(
        (
          await assembleScrapPage({
            slug: create.slug,
            locale: 'ja',
            audience: 'public',
          })
        )?.entries,
      ).toEqual([])
      saved = await executeScrapEditorCommand(
        {
          kind: 'edit-entry',
          slug: create.slug,
          locale: 'ja',
          entryId: 'draft',
          entryKind: 'note',
          published: true,
          body: 'Public entry',
          expectedVersion: saved.version,
        },
        repo,
      )
      const page = await assembleScrapPage({
        slug: create.slug,
        locale: 'en',
        audience: 'public',
      })
      expect(page?.entries[0]?.localizedSource).toBe('Public entry')
      expect(page?.entries[0]?.localizedState).toBe('fallback')
      expect(page?.pageIsIndexable).toBe(false)
      saved = await executeScrapEditorCommand(
        {
          ...create,
          kind: 'update',
          published: true,
          status: 'archived',
          expectedVersion: saved.version,
        },
        repo,
      )
      expect(
        await assembleScrapPage({
          slug: create.slug,
          locale: 'ja',
          audience: 'public',
        }),
      ).toBeNull()
    } finally {
      setScrapsRepositoryOverride(null)
    }
  })
})
