import { expect, test } from 'bun:test'
import { listAvailableParentNotes, reparentChildrenAfterNoteDelete, type NoteSourceEntry } from './notes'

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
