import { z } from 'zod'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'
import type { NotesRepository } from './notes.port'
import type { NoteSourceEntry } from './notes.domain'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import {
  compareNotesByCreatedAtAsc,
  createNoteSnowflakeId,
  isNoteSnowflakeId,
} from './notes.domain'

const NOTES_STORAGE_PATH = 'editor/notes.json'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
})

const RawNoteSourceEntrySchema = z.object({
  id: z.string().trim().min(1).optional(),
  body: LocalizedTextSchema,
  createdAt: z.string().datetime({ offset: true }),
  parentId: z.string().trim().min(1).optional(),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
})

function assertValidNoteThread(entries: readonly NoteSourceEntry[]) {
  const ids = new Set<string>()

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate note id: ${entry.id}`)
    }

    ids.add(entry.id)
  }

  for (const entry of entries) {
    if (!entry.parentId) {
      continue
    }

    if (entry.parentId === entry.id) {
      throw new Error(`Note cannot reference itself as parent: ${entry.id}`)
    }

    if (!ids.has(entry.parentId)) {
      throw new Error(
        `Note parentId must reference an existing note: ${entry.parentId}`,
      )
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

  function visit(noteId: string) {
    if (visited.has(noteId)) {
      return
    }

    if (visiting.has(noteId)) {
      throw new Error(`Circular note parent reference detected: ${noteId}`)
    }

    visiting.add(noteId)
    const entry = entriesById.get(noteId)

    if (entry?.parentId) {
      visit(entry.parentId)
    }

    visiting.delete(noteId)
    visited.add(noteId)
  }

  for (const entry of entries) {
    visit(entry.id)
  }
}

type RawNoteSourceEntry = z.infer<typeof RawNoteSourceEntrySchema>

function normalizeNoteIds(entries: RawNoteSourceEntry[]): NoteSourceEntry[] {
  const normalized = entries.map((entry) => ({
    id:
      typeof entry.id === 'string' && entry.id.trim()
        ? entry.id
        : entry.createdAt,
    body: entry.body,
    createdAt: entry.createdAt,
    parentId: entry.parentId,
    externalUrl: entry.externalUrl,
    published: entry.published,
  }))

  const legacyEntries = normalized
    .map((entry, originalIndex) => ({
      entry,
      originalIndex,
    }))
    .filter(({ entry }) => !isNoteSnowflakeId(entry.id))
    .sort((a, b) => {
      const timestampOrder = compareNotesByCreatedAtAsc(a.entry, b.entry)

      if (timestampOrder !== 0) {
        return timestampOrder
      }

      const idOrder = a.entry.id.localeCompare(b.entry.id)

      if (idOrder !== 0) {
        return idOrder
      }

      return a.originalIndex - b.originalIndex
    })

  const migratedIdByLegacyId = new Map<string, string>()
  const sequenceByTimestampMs = new Map<number, number>()

  for (const { entry } of legacyEntries) {
    const timestampMs = new Date(entry.createdAt).getTime()

    if (Number.isNaN(timestampMs)) {
      throw new Error(`Invalid createdAt timestamp: ${entry.createdAt}`)
    }

    const sequence = sequenceByTimestampMs.get(timestampMs) ?? 0
    sequenceByTimestampMs.set(timestampMs, sequence + 1)
    migratedIdByLegacyId.set(
      entry.id,
      createNoteSnowflakeId(timestampMs, sequence),
    )
  }

  return normalized.map((entry) => ({
    ...entry,
    id: migratedIdByLegacyId.get(entry.id) ?? entry.id,
    parentId: entry.parentId
      ? (migratedIdByLegacyId.get(entry.parentId) ?? entry.parentId)
      : undefined,
  }))
}

export function parseNoteSourceEntries(raw: unknown) {
  const entries = normalizeNoteIds(z.array(RawNoteSourceEntrySchema).parse(raw))

  for (const entry of entries) {
    if (entry.externalUrl) {
      normalizeExternalUrl(
        entry.externalUrl,
        `note external url (${entry.createdAt})`,
      )
    }
  }

  assertValidNoteThread(entries)

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

class NotesStorageRepository implements NotesRepository {
  async loadAll(): Promise<readonly NoteSourceEntry[]> {
    const { collection } = await loadNotesState()
    return collection
  }
}

export function makeNotesRepository() {
  return new NotesStorageRepository()
}
