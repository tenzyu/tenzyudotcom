import { cache } from 'react'
import {
  compareNotesByCreatedAtAsc,
  compareNotesByCreatedAtDesc,
} from './notes.domain'
import type { NoteSourceEntry } from './notes.domain'
import type { NotesRepository } from './notes.port'
import { makeNotesRepository } from './notes.infra'

export type NotePageItem = {
  id: string
  body: string
  createdAt: string
  depth: number
  externalUrl?: string
  parentId?: string
}

export class LoadNotesUseCase {
  constructor(private repository: NotesRepository) {}

  async execute(): Promise<readonly NoteSourceEntry[]> {
    const entries = await this.repository.loadAll()
    return entries.filter((entry) => entry.published !== false)
  }
}

export function makeLoadNotesUseCase() {
  return new LoadNotesUseCase(makeNotesRepository())
}

const loadNoteSourceEntries = cache(async () => {
  const useCase = makeLoadNotesUseCase()
  return useCase.execute()
})

export function assembleNoteThreadItems(
  entries: readonly NoteSourceEntry[],
  locale: string,
): NotePageItem[] {
  const noteLocale = locale === 'ja' ? 'ja' : 'en'
  const publishedEntries = entries.filter((entry) => entry.published !== false)
  const publishedEntryIds = new Set(publishedEntries.map((entry) => entry.id))
  const childrenByParentId = new Map<string, NoteSourceEntry[]>()
  const topLevelEntries: NoteSourceEntry[] = []

  for (const entry of publishedEntries) {
    if (entry.parentId && publishedEntryIds.has(entry.parentId)) {
      const siblings = childrenByParentId.get(entry.parentId) ?? []
      siblings.push(entry)
      childrenByParentId.set(entry.parentId, siblings)
      continue
    }

    topLevelEntries.push(entry)
  }

  topLevelEntries.sort(compareNotesByCreatedAtDesc)

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(compareNotesByCreatedAtAsc)
  }

  const items: NotePageItem[] = []

  function appendEntry(entry: NoteSourceEntry, depth: number) {
    items.push({
      id: entry.id,
      body: entry.body[noteLocale] || entry.body.ja,
      createdAt: entry.createdAt,
      depth,
      externalUrl: entry.externalUrl,
      parentId: entry.parentId,
    })

    const children = childrenByParentId.get(entry.id) ?? []

    for (const child of children) {
      appendEntry(child, depth + 1)
    }
  }

  for (const entry of topLevelEntries) {
    appendEntry(entry, 0)
  }

  return items
}

export async function assembleNotesPageData(
  locale: string,
): Promise<NotePageItem[]> {
  const entries = await loadNoteSourceEntries()
  return assembleNoteThreadItems(entries, locale)
}
