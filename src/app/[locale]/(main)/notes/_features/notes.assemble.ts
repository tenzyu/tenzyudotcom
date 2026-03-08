import { cache } from 'react'
import { loadEditorialCollection } from '@/lib/editorial/storage'

type NotePageItem = {
  body: string
  createdAt: string
  externalUrl?: string
}

const loadNoteSourceEntries = cache(async () => {
  const entries = await loadEditorialCollection('notes')
  return entries.filter((entry) => entry.published !== false)
})

export async function assembleNotesPageData(locale: string): Promise<NotePageItem[]> {
  const entries = await loadNoteSourceEntries()
  const noteLocale = locale === 'ja' ? 'ja' : 'en'

  return [...entries]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((entry) => ({
      body: entry.body[noteLocale] || entry.body.ja,
      createdAt: entry.createdAt,
      externalUrl: entry.externalUrl,
    }))
}
