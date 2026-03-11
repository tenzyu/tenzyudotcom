import { editorRepository } from '@/lib/editor/editor.contract'
import type { NotesRepository } from './notes.port'
import type { NoteSourceEntry } from './notes.domain'
import { NOTES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/notes'
export {
  NOTES_COLLECTION_DESCRIPTOR,
  parseNoteSourceEntries,
} from '@/features/editor-collections/notes'

export class EditorNotesRepository implements NotesRepository {
  async loadAll(): Promise<readonly NoteSourceEntry[]> {
    const { collection } = await editorRepository.loadState(
      NOTES_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const notesRepository = new EditorNotesRepository()
