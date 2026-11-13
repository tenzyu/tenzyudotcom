import type { NoteSourceEntry } from './notes.domain'

export interface NotesRepository {
  loadAll(): Promise<readonly NoteSourceEntry[]>
}
