import { describe, expect, test } from 'bun:test'
import {
  compareScrapEntryMetaByCreatedAtAsc,
  compareScrapsByUpdatedAtDesc,
  getBlogOutcomes,
  getIndexableLocaleVariants,
  getScrapStoragePaths,
  isPublicScrap,
  isValidScrapEntryId,
  isValidScrapSlug,
  projectScrapIndexEntry,
  resolveLocalizedDocumentRef,
  type ContentRelation,
  type LocalizedDocumentRef,
  type ScrapManifest,
} from './scraps.domain'
import {
  parseScrapEntryMeta,
  parseScrapIndexProjection,
  parseScrapManifest,
} from './scraps.validation'

const baseLeadJa: LocalizedDocumentRef = {
  locale: 'ja',
  pathname: 'scraps/test/lead.ja.mdx',
  state: 'original',
}

const baseLeadEn: LocalizedDocumentRef = {
  locale: 'en',
  pathname: 'scraps/test/lead.en.mdx',
  state: 'manual',
}

const baseLead: LocalizedDocumentRef[] = [baseLeadJa, baseLeadEn]

const baseManifest: ScrapManifest = {
  id: 'scrap_01',
  slug: 'test',
  title: 'Test scrap',
  hypothesis: 'Does this work?',
  status: 'open',
  tags: ['next', 'mdx'],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-02T00:00:00Z',
  published: true,
  primaryLocale: 'ja',
  lead: baseLead,
  entryIds: ['entry-1'],
}

describe('parseScrapManifest', () => {
  test('accepts a valid manifest and normalizes tags', () => {
    const manifest = parseScrapManifest({
      ...baseManifest,
      tags: ['next', 'next', '  mdx '],
    })

    expect(manifest.tags).toEqual(['next', 'mdx'])
    expect(manifest.entryIds).toEqual(['entry-1'])
  })

  test('rejects invalid slug', () => {
    expect(() =>
      parseScrapManifest({
        ...baseManifest,
        slug: 'Invalid Slug',
      }),
    ).toThrow(/slug/)
  })

  test('rejects updatedAt earlier than createdAt', () => {
    expect(() =>
      parseScrapManifest({
        ...baseManifest,
        createdAt: '2026-06-02T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      }),
    ).toThrow(/updatedAt/)
  })

  test('rejects duplicate lead locale', () => {
    expect(() =>
      parseScrapManifest({
        ...baseManifest,
        lead: [...baseLead, { ...baseLeadJa }],
      }),
    ).toThrow(/duplicate lead locale/)
  })

  test('rejects duplicate entry ids', () => {
    expect(() =>
      parseScrapManifest({
        ...baseManifest,
        entryIds: ['entry-1', 'entry-1'],
      }),
    ).toThrow(/duplicate entry id/)
  })

  test('requires primaryLocale in lead when lead docs exist', () => {
    expect(() =>
      parseScrapManifest({
        ...baseManifest,
        lead: [
          {
            locale: 'en',
            pathname: 'scraps/test/lead.en.mdx',
            state: 'manual',
          },
        ],
      }),
    ).toThrow(/primaryLocale/)
  })

  test('accepts manifest without lead documents', () => {
    const manifest = parseScrapManifest({
      ...baseManifest,
      lead: [],
    })
    expect(manifest.lead).toEqual([])
  })
})

describe('parseScrapEntryMeta', () => {
  test('accepts a valid entry meta', () => {
    const entry = parseScrapEntryMeta({
      id: 'entry-1',
      scrapSlug: 'test',
      kind: 'note',
      createdAt: '2026-06-01T00:00:00Z',
      published: true,
      documents: [
        {
          locale: 'ja',
          pathname: 'scraps/test/entries/entry-1/entry.ja.mdx',
          state: 'original',
        },
      ],
    })
    expect(entry.kind).toBe('note')
  })

  test('requires at least one document', () => {
    expect(() =>
      parseScrapEntryMeta({
        id: 'entry-1',
        scrapSlug: 'test',
        kind: 'note',
        createdAt: '2026-06-01T00:00:00Z',
        published: true,
        documents: [],
      }),
    ).toThrow()
  })

  test('rejects duplicate locale documents', () => {
    expect(() =>
      parseScrapEntryMeta({
        id: 'entry-1',
        scrapSlug: 'test',
        kind: 'note',
        createdAt: '2026-06-01T00:00:00Z',
        published: true,
        documents: [
          {
            locale: 'ja',
            pathname: 'scraps/test/entries/entry-1/entry.ja.mdx',
            state: 'original',
          },
          {
            locale: 'ja',
            pathname: 'scraps/test/entries/entry-1/entry.ja.alt.mdx',
            state: 'original',
          },
        ],
      }),
    ).toThrow(/duplicate entry locale/)
  })

  test('rejects updatedAt earlier than createdAt', () => {
    expect(() =>
      parseScrapEntryMeta({
        id: 'entry-1',
        scrapSlug: 'test',
        kind: 'note',
        createdAt: '2026-06-02T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
        published: true,
        documents: [
          {
            locale: 'ja',
            pathname: 'scraps/test/entries/entry-1/entry.ja.mdx',
            state: 'original',
          },
        ],
      }),
    ).toThrow(/updatedAt/)
  })
})

describe('resolveLocalizedDocumentRef', () => {
  test('returns the requested locale variant when indexable', () => {
    const ref = resolveLocalizedDocumentRef({
      refs: baseLead,
      requestedLocale: 'en',
      primaryLocale: 'ja',
      audience: 'public',
    })
    expect(ref?.locale).toBe('en')
  })

  test('falls back to primary locale when requested is missing', () => {
    const ref = resolveLocalizedDocumentRef({
      refs: [baseLeadJa],
      requestedLocale: 'en',
      primaryLocale: 'ja',
      audience: 'public',
    })
    expect(ref?.locale).toBe('ja')
  })

  test('public audience hides machine-draft variants', () => {
    const refs: LocalizedDocumentRef[] = [
      baseLeadJa,
      {
        locale: 'en',
        pathname: 'scraps/test/lead.en.mdx',
        state: 'machine-draft',
      },
    ]

    const ref = resolveLocalizedDocumentRef({
      refs,
      requestedLocale: 'en',
      primaryLocale: 'ja',
      audience: 'public',
    })

    expect(ref?.locale).toBe('ja')
  })

  test('admin audience surfaces machine-draft variants', () => {
    const refs: LocalizedDocumentRef[] = [
      baseLeadJa,
      {
        locale: 'en',
        pathname: 'scraps/test/lead.en.mdx',
        state: 'machine-draft',
      },
    ]

    const ref = resolveLocalizedDocumentRef({
      refs,
      requestedLocale: 'en',
      primaryLocale: 'ja',
      audience: 'admin',
    })

    expect(ref?.locale).toBe('en')
    expect(ref?.state).toBe('machine-draft')
  })

  test('returns null when no suitable variant exists', () => {
    const ref = resolveLocalizedDocumentRef({
      refs: [
        {
          locale: 'en',
          pathname: 'scraps/test/lead.en.mdx',
          state: 'machine-draft',
        },
      ],
      requestedLocale: 'ja',
      primaryLocale: 'ja',
      audience: 'public',
    })

    expect(ref).toBeNull()
  })
})

describe('getIndexableLocaleVariants', () => {
  test('includes only original/manual states', () => {
    const refs: LocalizedDocumentRef[] = [
      baseLeadJa,
      {
        locale: 'en',
        pathname: 'scraps/test/lead.en.mdx',
        state: 'machine-draft',
      },
    ]

    expect(getIndexableLocaleVariants(refs)).toEqual(['ja'])
  })
})

describe('isPublicScrap', () => {
  test('excludes unpublished scraps', () => {
    expect(isPublicScrap({ status: 'open', published: false })).toBe(false)
  })

  test('excludes archived scraps', () => {
    expect(isPublicScrap({ status: 'archived', published: true })).toBe(false)
  })

  test('keeps published closed scraps public', () => {
    expect(isPublicScrap({ status: 'closed', published: true })).toBe(true)
  })

  test('keeps published open scraps public', () => {
    expect(isPublicScrap({ status: 'open', published: true })).toBe(true)
  })
})

describe('compareScrapsByUpdatedAtDesc', () => {
  test('newer updatedAt sorts first', () => {
    const items = [
      { updatedAt: '2026-06-01T00:00:00Z' },
      { updatedAt: '2026-06-03T00:00:00Z' },
      { updatedAt: '2026-06-02T00:00:00Z' },
    ].sort(compareScrapsByUpdatedAtDesc)
    expect(items.map((i) => i.updatedAt)).toEqual([
      '2026-06-03T00:00:00Z',
      '2026-06-02T00:00:00Z',
      '2026-06-01T00:00:00Z',
    ])
  })
})

describe('compareScrapEntryMetaByCreatedAtAsc', () => {
  test('older createdAt sorts first (chronological)', () => {
    const items = [
      { createdAt: '2026-06-02T00:00:00Z' },
      { createdAt: '2026-06-01T00:00:00Z' },
      { createdAt: '2026-06-03T00:00:00Z' },
    ].sort(compareScrapEntryMetaByCreatedAtAsc)
    expect(items.map((i) => i.createdAt)).toEqual([
      '2026-06-01T00:00:00Z',
      '2026-06-02T00:00:00Z',
      '2026-06-03T00:00:00Z',
    ])
  })
})

describe('projectScrapIndexEntry', () => {
  test('summarizes lead variants and indexable locales', () => {
    const projection = projectScrapIndexEntry(baseManifest)
    expect(projection.slug).toBe('test')
    expect(projection.lead).toEqual([
      { locale: 'ja', state: 'original' },
      { locale: 'en', state: 'manual' },
    ])
    expect(projection.indexableLocales).toEqual(['ja', 'en'])
    expect(projection.entryCount).toBe(1)
    expect(projection.hasOutcomes).toBe(false)
  })

  test('excludes machine-draft locales from indexableLocales', () => {
    const projection = projectScrapIndexEntry({
      ...baseManifest,
      lead: [
        baseLeadJa,
        {
          locale: 'en',
          pathname: 'scraps/test/lead.en.mdx',
          state: 'machine-draft',
        },
      ],
    })
    expect(projection.indexableLocales).toEqual(['ja'])
  })
})

describe('parseScrapIndexProjection', () => {
  test('rejects duplicate slugs in projection', () => {
    expect(() =>
      parseScrapIndexProjection([
        projectScrapIndexEntry(baseManifest),
        projectScrapIndexEntry(baseManifest),
      ]),
    ).toThrow(/duplicate scrap slug/)
  })

  test('accepts a valid projection', () => {
    const parsed = parseScrapIndexProjection([
      projectScrapIndexEntry(baseManifest),
      projectScrapIndexEntry({
        ...baseManifest,
        slug: 'another',
        title: 'Another',
      }),
    ])
    expect(parsed.map((entry) => entry.slug)).toEqual(['test', 'another'])
  })
})

describe('getBlogOutcomes', () => {
  test('supports multiple blog outcomes', () => {
    const outcomes: ContentRelation[] = [
      {
        kind: 'blog',
        relation: 'derived-into',
        slug: 'one',
        title: 'One',
      },
      {
        kind: 'blog',
        relation: 'expanded-into',
        slug: 'two',
        title: 'Two',
      },
      {
        kind: 'external',
        relation: 'summarized-by',
        href: 'https://example.com',
      },
    ]

    expect(getBlogOutcomes(outcomes)).toHaveLength(2)
  })

  test('returns empty array when outcomes are missing', () => {
    expect(getBlogOutcomes(undefined)).toEqual([])
  })
})

describe('slug + entry id validators', () => {
  test('accepts standard slugs', () => {
    expect(isValidScrapSlug('hello-world')).toBe(true)
    expect(isValidScrapSlug('a1-b2')).toBe(true)
  })

  test('rejects invalid slugs', () => {
    expect(isValidScrapSlug('Hello')).toBe(false)
    expect(isValidScrapSlug('-leading')).toBe(false)
    expect(isValidScrapSlug('with space')).toBe(false)
    expect(isValidScrapSlug('')).toBe(false)
  })

  test('entry id validator mirrors slug validator', () => {
    expect(isValidScrapEntryId('e1-2026')).toBe(true)
    expect(isValidScrapEntryId('E1')).toBe(false)
  })
})

describe('getScrapStoragePaths', () => {
  test('produces deterministic GitHub content storage pathnames', () => {
    const paths = getScrapStoragePaths('my-scrap')
    expect(paths.manifest).toBe('scraps/my-scrap/manifest.json')
    expect(paths.lead('ja')).toBe('scraps/my-scrap/lead.ja.mdx')
    expect(paths.entryMeta('e1')).toBe(
      'scraps/my-scrap/entries/e1/meta.json',
    )
    expect(paths.entryDocument('e1', 'en')).toBe(
      'scraps/my-scrap/entries/e1/entry.en.mdx',
    )
  })

  test('rejects invalid slug', () => {
    expect(() => getScrapStoragePaths('Bad Slug')).toThrow(/Invalid scrap slug/)
  })
})
