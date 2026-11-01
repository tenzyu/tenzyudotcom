import { describe, expect, test } from 'bun:test'
import {
  buildScrapAlternateLanguages,
  buildScrapListAlternateLanguages,
  filterPublicScrapIndex,
  getPublicScrapStaticParams,
} from './scraps.assemble'
import {
  projectScrapIndexEntry,
  type ScrapIndexProjection,
  type ScrapManifest,
} from './scraps.domain'

function makeManifest(overrides: Partial<ScrapManifest> = {}): ScrapManifest {
  return {
    id: 'id',
    slug: 'sample',
    title: 'Sample',
    hypothesis: 'sample hypothesis',
    status: 'open',
    tags: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-02T00:00:00Z',
    published: true,
    primaryLocale: 'ja',
    lead: [
      {
        locale: 'ja',
        pathname: 'scraps/sample/lead.ja.mdx',
        state: 'original',
      },
    ],
    entryIds: [],
    ...overrides,
  }
}

describe('filterPublicScrapIndex', () => {
  test('excludes unpublished and archived entries', () => {
    const projection: ScrapIndexProjection = [
      projectScrapIndexEntry(
        makeManifest({ slug: 'public-open', status: 'open' }),
      ),
      projectScrapIndexEntry(
        makeManifest({ slug: 'public-closed', status: 'closed' }),
      ),
      projectScrapIndexEntry(
        makeManifest({ slug: 'archived', status: 'archived' }),
      ),
      projectScrapIndexEntry(
        makeManifest({ slug: 'unpublished', published: false }),
      ),
    ]

    const filtered = filterPublicScrapIndex(projection)
    expect(filtered.map((entry) => entry.slug)).toEqual([
      'public-open',
      'public-closed',
    ])
  })

  test('sorts by updatedAt descending', () => {
    const projection: ScrapIndexProjection = [
      projectScrapIndexEntry(
        makeManifest({ slug: 'older', updatedAt: '2026-06-01T00:00:00Z' }),
      ),
      projectScrapIndexEntry(
        makeManifest({ slug: 'newer', updatedAt: '2026-06-10T00:00:00Z' }),
      ),
      projectScrapIndexEntry(
        makeManifest({ slug: 'middle', updatedAt: '2026-06-05T00:00:00Z' }),
      ),
    ]
    const filtered = filterPublicScrapIndex(projection)
    expect(filtered.map((entry) => entry.slug)).toEqual([
      'newer',
      'middle',
      'older',
    ])
  })
})

describe('getPublicScrapStaticParams', () => {
  test('returns only public scrap slugs', () => {
    const projection: ScrapIndexProjection = [
      projectScrapIndexEntry(makeManifest({ slug: 'public' })),
      projectScrapIndexEntry(
        makeManifest({ slug: 'archived', status: 'archived' }),
      ),
    ]
    expect(getPublicScrapStaticParams(projection)).toEqual([
      { slug: 'public' },
    ])
  })
})

describe('buildScrapAlternateLanguages', () => {
  test('only emits indexable locale URLs', () => {
    const alternates = buildScrapAlternateLanguages('hello', ['ja'])
    expect(Object.keys(alternates)).toEqual(['ja'])
    expect(alternates.ja).toMatch(/\/scraps\/hello$/)
  })

  test('returns empty object when no indexable locales exist', () => {
    expect(buildScrapAlternateLanguages('hello', [])).toEqual({})
  })

  test('emits both locales when both are indexable', () => {
    const alternates = buildScrapAlternateLanguages('hello', ['ja', 'en'])
    expect(Object.keys(alternates).sort()).toEqual(['en', 'ja'])
  })
})

describe('buildScrapListAlternateLanguages', () => {
  test('always emits both locale URLs for the list page', () => {
    const alternates = buildScrapListAlternateLanguages()
    expect(Object.keys(alternates).sort()).toEqual(['en', 'ja'])
  })
})
