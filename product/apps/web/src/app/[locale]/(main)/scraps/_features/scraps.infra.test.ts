import { describe, expect, test } from 'bun:test'
import type {
  ContentRepository,
  ContentRepositoryTextFile,
} from '@/lib/content-store/content-store.domain'
import { createContentVersion } from '@/lib/content-store/content-version.infra'
import {
  applyScrapIndexProjectionDelta,
  loadScrapEntryMeta,
  loadScrapIndex,
  loadScrapManifest,
  rebuildScrapIndexProjection,
  removeFromScrapIndexProjection,
  saveScrapIndexProjection,
  setScrapsRepositoryOverride,
} from './scraps.infra'
import {
  type ScrapEntryMeta,
  type ScrapIndexProjection,
  type ScrapManifest,
  projectScrapIndexEntry,
} from './scraps.domain'

class InMemoryRepo implements ContentRepository {
  files = new Map<string, string>()

  async snapshot() {
    const files = new Map(this.files)
    return {
      version: createContentVersion(JSON.stringify([...files])),
      loadText: async (pathname: string) => {
        const content = files.get(pathname)
        return content === undefined ? null : { content }
      },
    }
  }

  async commit(): Promise<string> {
    throw new Error('Read-only aggregate fixture')
  }

  async loadText(pathname: string): Promise<ContentRepositoryTextFile | null> {
    const content = this.files.get(pathname)
    if (content === undefined) {
      return null
    }
    return {
      content,
      path: pathname,
      version: createContentVersion(content.trimEnd()),
    }
  }

  async saveText(pathname: string, content: string) {
    this.files.set(pathname, content)
  }

  async loadJson<T>(pathname: string): Promise<T | null> {
    const content = this.files.get(pathname)
    if (content === undefined) {
      return null
    }
    return JSON.parse(content) as T
  }

  async saveJson<T>(pathname: string, value: T) {
    this.files.set(pathname, `${JSON.stringify(value, null, 2)}\n`)
  }

  async list(prefix: string) {
    return [...this.files.keys()].filter((pathname) =>
      pathname.startsWith(prefix),
    )
  }

  async delete(pathname: string) {
    this.files.delete(pathname)
  }
}

function makeManifest(slug: string, overrides: Partial<ScrapManifest> = {}) {
  return {
    id: `id-${slug}`,
    slug,
    title: `Scrap ${slug}`,
    hypothesis: 'h',
    status: 'open',
    tags: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-02T00:00:00Z',
    published: true,
    primaryLocale: 'ja',
    lead: [
      {
        locale: 'ja',
        pathname: `scraps/${slug}/lead.ja.mdx`,
        state: 'original',
      },
    ],
    entryIds: [],
    ...overrides,
  } satisfies ScrapManifest
}

describe('scraps infra (in-memory repository)', () => {
  test('loadScrapIndex returns [] when no projection exists', async () => {
    const repo = new InMemoryRepo()
    setScrapsRepositoryOverride(repo)
    try {
      expect(await loadScrapIndex()).toEqual([])
    } finally {
      setScrapsRepositoryOverride(null)
    }
  })

  test('saveScrapIndexProjection + loadScrapIndex round-trip', async () => {
    const repo = new InMemoryRepo()
    setScrapsRepositoryOverride(repo)
    try {
      const projection: ScrapIndexProjection = [
        projectScrapIndexEntry(makeManifest('first')),
        projectScrapIndexEntry(makeManifest('second')),
      ]
      await saveScrapIndexProjection(projection)
      const loaded = await loadScrapIndex()
      expect(loaded.map((entry) => entry.slug)).toEqual(['first', 'second'])
    } finally {
      setScrapsRepositoryOverride(null)
    }
  })

  test('applyScrapIndexProjectionDelta replaces matching slug entry', () => {
    const projection: ScrapIndexProjection = [
      projectScrapIndexEntry(
        makeManifest('first', { updatedAt: '2026-06-01T00:00:00Z' }),
      ),
      projectScrapIndexEntry(
        makeManifest('second', { updatedAt: '2026-06-02T00:00:00Z' }),
      ),
    ]
    const next = applyScrapIndexProjectionDelta(
      projection,
      makeManifest('first', { updatedAt: '2026-06-03T00:00:00Z' }),
    )
    expect(next.map((entry) => entry.slug)).toEqual(['first', 'second'])
    expect(next[0]?.updatedAt).toBe('2026-06-03T00:00:00Z')
  })

  test('removeFromScrapIndexProjection removes the targeted slug', () => {
    const projection: ScrapIndexProjection = [
      projectScrapIndexEntry(makeManifest('first')),
      projectScrapIndexEntry(makeManifest('second')),
    ]
    const next = removeFromScrapIndexProjection(projection, 'first')
    expect(next.map((entry) => entry.slug)).toEqual(['second'])
  })

  test('rebuildScrapIndexProjection walks the tree and rebuilds entries', async () => {
    const repo = new InMemoryRepo()
    setScrapsRepositoryOverride(repo)
    try {
      const a = makeManifest('alpha', { updatedAt: '2026-06-01T00:00:00Z' })
      const b = makeManifest('beta', { updatedAt: '2026-06-10T00:00:00Z' })
      await repo.saveJson(`scraps/${a.slug}/manifest.json`, a)
      await repo.saveJson(`scraps/${b.slug}/manifest.json`, b)
      const projection = await rebuildScrapIndexProjection()
      expect(projection.map((entry) => entry.slug)).toEqual(['beta', 'alpha'])
    } finally {
      setScrapsRepositoryOverride(null)
    }
  })

  test('loadScrapManifest + loadScrapEntryMeta read from the repository', async () => {
    const repo = new InMemoryRepo()
    setScrapsRepositoryOverride(repo)
    try {
      const manifest = makeManifest('alpha', { entryIds: ['e1'] })
      await repo.saveJson(`scraps/${manifest.slug}/manifest.json`, manifest)
      const meta = {
        id: 'e1',
        scrapSlug: manifest.slug,
        kind: 'note' as const,
        createdAt: '2026-06-02T00:00:00Z',
        published: true,
        documents: [
          {
            locale: 'ja' as const,
            pathname: `scraps/${manifest.slug}/entries/e1/entry.ja.mdx`,
            state: 'original' as const,
          },
        ],
      } satisfies ScrapEntryMeta
      await repo.saveJson(`scraps/${manifest.slug}/entries/e1/meta.json`, meta)
      const snapshot = await repo.snapshot()
      const loadedManifest = await loadScrapManifest(manifest.slug, snapshot)
      expect(loadedManifest?.manifest.entryIds).toEqual(['e1'])
      const loadedEntry = await loadScrapEntryMeta(
        manifest.slug,
        'e1',
        snapshot,
      )
      expect(loadedEntry?.meta.kind).toBe('note')
    } finally {
      setScrapsRepositoryOverride(null)
    }
  })
})
