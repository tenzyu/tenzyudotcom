import { z } from 'zod'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'
import type { NotesRepository } from './notes.port'
import type { NoteSourceEntry } from './notes.domain'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'

const NOTES_STORAGE_PATH = 'editor/notes.json'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
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
      normalizeExternalUrl(
        entry.externalUrl,
        `note external url (${entry.createdAt})`,
      )
    }
  }

  return entries
}

export async function loadNotesState() {
  return loadJsonCollection(
    NOTES_STORAGE_PATH,
    parseNoteSourceEntries,
    () => [] as readonly NoteSourceEntry[],
  )
}

export async function saveNotesState(
  rawJson: string,
  expectedVersion?: string,
) {
  return saveJsonCollection(
    NOTES_STORAGE_PATH,
    rawJson,
    parseNoteSourceEntries,
    expectedVersion,
  )
}

export class NotesStorageRepository implements NotesRepository {
  async loadAll(): Promise<readonly NoteSourceEntry[]> {
    const { collection } = await loadNotesState()
    return collection
  }
}

export function makeNotesRepository() {
  return new NotesStorageRepository()
}
