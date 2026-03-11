import { cache } from 'react'
import { compareNotesByCreatedAtDesc } from './notes.domain'
import type { NoteSourceEntry } from './notes.domain'
import type { NotesRepository } from './notes.port'
import { notesRepository } from './notes.contract'

type NotePageItem = {
  body: string
  createdAt: string
  externalUrl?: string
}

export class LoadNotesUseCase {
  constructor(private repository: NotesRepository) {}

  async execute(): Promise<readonly NoteSourceEntry[]> {
    const entries = await this.repository.loadAll()
    return entries.filter((entry) => entry.published !== false)
  }
}

export function makeLoadNotesUseCase() {
  return new LoadNotesUseCase(notesRepository)
}

const loadNoteSourceEntries = cache(async () => {
  const useCase = makeLoadNotesUseCase()
  return useCase.execute()
})

export async function assembleNotesPageData(
  locale: string,
): Promise<NotePageItem[]> {
  const entries = await loadNoteSourceEntries()
  const noteLocale = locale === 'ja' ? 'ja' : 'en'

  return [...entries].sort(compareNotesByCreatedAtDesc).map((entry) => ({
    body: entry.body[noteLocale] || entry.body.ja,
    createdAt: entry.createdAt,
    externalUrl: entry.externalUrl,
  }))
}
