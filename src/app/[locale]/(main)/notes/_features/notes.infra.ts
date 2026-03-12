import type { EditorRepository } from '@/lib/editor/editor.port'
import type { NotesRepository } from './notes.port'
import type { NoteSourceEntry } from './notes.domain'
import { NOTES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/notes'

export class EditorNotesRepository implements NotesRepository {
  constructor(private readonly editorRepository: EditorRepository) {}

  async loadAll(): Promise<readonly NoteSourceEntry[]> {
    const { collection } = await this.editorRepository.loadState(
      NOTES_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}
