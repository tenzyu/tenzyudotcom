import { expect, test } from 'bun:test'
import { createNoteId, createPublicNoteGraph, parseNoteSourceEntries, listAvailableParentNotes, reparentChildrenAfterNoteDelete, type NoteSourceEntry } from './notes'

const note = (id: string, parentId?: string): NoteSourceEntry => ({ id, parentId, body: { ja: id, en: id }, createdAt: '2026-01-01T00:00:00Z' })

test('a note cannot be reparented to itself or its descendants', () => {
  const entries = [note('root'), note('child', 'root'), note('leaf', 'child'), note('other')]
  expect(listAvailableParentNotes(entries, 'root').map(n => n.id)).toEqual(['other'])
  expect(reparentChildrenAfterNoteDelete(entries, 'child').find(n => n.id === 'leaf')?.parentId).toBe('root')
})

test('large chains use iterative, indexed traversal', () => {
  const entries = Array.from({ length: 10000 }, (_, i) => note(String(i), i ? String(i - 1) : undefined))
  expect(listAvailableParentNotes(entries, '0')).toEqual([])
})

test('validates and projects deep forests without recursive stack growth', () => {
  const entries = Array.from({ length: 20000 }, (_, i) =>
    note(String(i + 1), i ? String(i) : undefined)).reverse()
  const parsed = parseNoteSourceEntries(entries)
  const graph = createPublicNoteGraph(parsed)
  const feed = graph.feed()
  expect(feed.length).toBe(20000)
  expect(feed[19999]?.depth).toBe(19999)
  const detail = graph.thread('20000')
  expect(detail?.ancestors.length).toBe(19999)
  expect(detail?.ancestors[0]?.entry.id).toBe('1')
  expect(detail?.note.depth).toBe(19999)
})

test('rejects invalid parent topology and preserves private-parent promotion', () => {
  expect(() => parseNoteSourceEntries([note('1', '2'), note('2', '1')]))
    .toThrow('Circular note parent reference detected')
  expect(() => parseNoteSourceEntries([note('1', '2')]))
    .toThrow('Note parentId must reference an existing note')
  expect(() => parseNoteSourceEntries([note('1', '1')]))
    .toThrow('Note cannot reference itself as parent')
  expect(() => parseNoteSourceEntries([note('1'), note('1')]))
    .toThrow('Duplicate note id')
  const graph = createPublicNoteGraph([{ ...note('1'), published: false }, note('2', '1')])
  expect(graph.feed().map(({ entry, depth }) => [entry.id, depth])).toEqual([['2', 0]])
  expect(graph.thread('1')).toBeUndefined()
})

test('note IDs stay unique and ordered when the clock rolls back or the sequence fills', () => {
  const originalNow = Date.now
  let now = originalNow()
  Date.now = () => now
  try {
    const ids = [createNoteId()]
    now--
    ids.push(createNoteId())
    now++
    for (let i = 0; i < 4097; i++) ids.push(createNoteId())
    now += 10
    ids.push(createNoteId())
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => /^\d+$/.test(id))).toBe(true)
    for (let i = 1; i < ids.length; i++) {
      expect(BigInt(ids[i]!)).toBeGreaterThan(BigInt(ids[i - 1]!))
    }
  } finally {
    Date.now = originalNow
  }
})
