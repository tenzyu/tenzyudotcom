import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'
import { editorRepository } from '@/lib/editor/editor.contract'
import type { NotesRepository } from './notes.port'
import type { NoteSourceEntry } from './notes.domain'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().min(1),
})

const NoteSourceEntrySchema = z.object({
  body: LocalizedTextSchema,
  createdAt: z.string().datetime({ offset: true }),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
})

export function parseNoteSourceEntries(raw: unknown) {
  const entries = z.array(NoteSourceEntrySchema).parse(raw)

  for (const entry of entries) {
    if (entry.externalUrl) {
      normalizeExternalUrl(entry.externalUrl, `note external url (${entry.createdAt})`)
    }
  }

  return entries
}

export class EditorNotesRepository implements NotesRepository {
  async loadAll(): Promise<readonly NoteSourceEntry[]> {
    const { collection } = await editorRepository.loadState('notes')
    return collection
  }
}

export const notesRepository = new EditorNotesRepository()
