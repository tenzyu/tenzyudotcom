'use server'

import { saveCollectionForm } from '@/features/content-editor/collection-save'
import type { CollectionSaveState } from '@/features/content-editor/editor-mutation.domain'
import { saveNotesState } from '../notes.infra'

export async function saveNotesCollectionAction(
  _previous: CollectionSaveState,
  formData: FormData,
): Promise<CollectionSaveState> {
  return saveCollectionForm(formData, 'notes', saveNotesState)
}
