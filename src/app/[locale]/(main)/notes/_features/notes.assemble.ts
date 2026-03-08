import { cache } from 'react'
import { loadEditorialCollection } from '@/lib/editorial/storage'

type NotePageItem = {
  body: string
  createdAt: string
  externalUrl?: string
}

type NoteTimestampedEntry = {
  createdAt: string
}

const loadNoteSourceEntries = cache(async () => {
  const entries = await loadEditorialCollection('notes')
  return entries.filter((entry) => entry.published !== false)
})

export function compareNotesByCreatedAtDesc(
  a: NoteTimestampedEntry,
  b: NoteTimestampedEntry,
) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

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
