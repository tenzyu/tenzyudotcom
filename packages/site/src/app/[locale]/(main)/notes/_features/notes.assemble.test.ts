import { describe, expect, test } from 'bun:test'
import {
  compareNotesByCreatedAtDesc,
  reparentChildrenAfterNoteDelete,
} from './notes.domain'
import {
  assembleNoteDetailPageDataFromEntries,
  assembleNoteThreadItems,
} from './notes.assemble'
import { parseNoteSourceEntries } from './notes.infra'

describe('compareNotesByCreatedAtDesc', () => {
  test('sorts by parsed timestamps instead of raw ISO strings', () => {
    const sorted = [
      { createdAt: '2026-03-08T00:30:00+09:00' },
      { createdAt: '2026-03-07T16:00:00Z' },
    ].sort(compareNotesByCreatedAtDesc)

    expect(sorted.map((note) => note.createdAt)).toEqual([
      '2026-03-07T16:00:00Z',
      '2026-03-08T00:30:00+09:00',
    ])
  })
})

describe('assembleNoteThreadItems', () => {
  test('orders top-level notes descending and replies ascending', () => {
    const items = assembleNoteThreadItems(
      [
        {
          id: 'root-1',
          body: { ja: 'root-1', en: '' },
          createdAt: '2026-03-07T09:00:00Z',
          published: true,
        },
        {
          id: 'reply-newer',
          parentId: 'root-1',
          body: { ja: 'reply-newer', en: '' },
          createdAt: '2026-03-07T11:00:00Z',
          published: true,
        },
        {
          id: 'reply-older',
          parentId: 'root-1',
          body: { ja: 'reply-older', en: '' },
          createdAt: '2026-03-07T10:00:00Z',
          published: true,
        },
        {
          id: 'root-2',
          body: { ja: 'root-2', en: '' },
          createdAt: '2026-03-08T09:00:00Z',
          published: true,
        },
      ],
      'ja',
    )

    expect(items.map((item) => item.id)).toEqual([
      'root-2',
      'root-1',
      'reply-older',
      'reply-newer',
    ])
    expect(items.map((item) => item.depth)).toEqual([0, 0, 1, 1])
    expect(items.map((item) => item.hasConnectorBelow)).toEqual([
      false,
      true,
      true,
      false,
    ])
  })

  test('promotes replies when the parent is unpublished', () => {
    const items = assembleNoteThreadItems(
      [
        {
          id: 'hidden-parent',
          body: { ja: 'hidden', en: '' },
          createdAt: '2026-03-08T09:00:00Z',
          published: false,
        },
        {
          id: 'visible-child',
          parentId: 'hidden-parent',
          body: { ja: 'child', en: '' },
          createdAt: '2026-03-08T10:00:00Z',
          published: true,
        },
      ],
      'ja',
    )

    expect(items).toEqual([
      {
        id: 'visible-child',
        body: 'child',
        createdAt: '2026-03-08T10:00:00Z',
        depth: 0,
        externalUrl: undefined,
        parentId: 'hidden-parent',
        hasConnectorAbove: false,
        hasConnectorBelow: false,
        sharePath: '/ja/notes/visible-child',
        showBottomBorder: true,
      },
    ])
  })
})

describe('parseNoteSourceEntries', () => {
  test('fills missing ids from createdAt for legacy entries', () => {
    const entries = parseNoteSourceEntries([
      {
        body: { ja: 'legacy', en: '' },
        createdAt: '2026-03-08T10:00:00Z',
        published: true,
      },
    ])

    expect(entries[0]?.id).toBe('2026-03-08T10:00:00Z')
  })

  test('rejects circular parent references', () => {
    expect(() =>
      parseNoteSourceEntries([
        {
          id: 'a',
          parentId: 'b',
          body: { ja: 'a', en: '' },
          createdAt: '2026-03-08T10:00:00Z',
          published: true,
        },
        {
          id: 'b',
          parentId: 'a',
          body: { ja: 'b', en: '' },
          createdAt: '2026-03-08T11:00:00Z',
          published: true,
        },
      ]),
    ).toThrow('Circular note parent reference detected')
  })
})

describe('reparentChildrenAfterNoteDelete', () => {
  test('promotes direct children to the deleted parents parent', () => {
    const nextEntries = reparentChildrenAfterNoteDelete(
      [
        {
          id: 'root',
          body: { ja: 'root', en: '' },
          createdAt: '2026-03-08T09:00:00Z',
          published: true,
        },
        {
          id: 'child',
          parentId: 'root',
          body: { ja: 'child', en: '' },
          createdAt: '2026-03-08T10:00:00Z',
          published: true,
        },
      ],
      'root',
    )

    expect(nextEntries).toEqual([
      {
        id: 'child',
        parentId: undefined,
        body: { ja: 'child', en: '' },
        createdAt: '2026-03-08T10:00:00Z',
        published: true,
      },
    ])
  })
})

describe('assembleNoteDetailPageDataFromEntries', () => {
  test('returns ancestors, target note, and nested replies', () => {
    const pageData = assembleNoteDetailPageDataFromEntries(
      [
        {
          id: 'root',
          body: { ja: 'root', en: '' },
          createdAt: '2026-03-08T09:00:00Z',
          published: true,
        },
        {
          id: 'target',
          parentId: 'root',
          body: { ja: 'target', en: '' },
          createdAt: '2026-03-08T10:00:00Z',
          published: true,
        },
        {
          id: 'child',
          parentId: 'target',
          body: { ja: 'child', en: '' },
          createdAt: '2026-03-08T11:00:00Z',
          published: true,
        },
        {
          id: 'grandchild',
          parentId: 'child',
          body: { ja: 'grandchild', en: '' },
          createdAt: '2026-03-08T12:00:00Z',
          published: true,
        },
      ],
      'target',
      'ja',
    )

    expect(pageData?.ancestors.map((item) => item.id)).toEqual(['root'])
    expect(pageData?.note.id).toBe('target')
    expect(pageData?.replies.map((item) => item.id)).toEqual([
      'child',
      'grandchild',
    ])
  })
})
