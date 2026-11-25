'use server'

import { saveCollectionForm } from '@/features/content-editor/collection-save'
import type { CollectionSaveState } from '@/features/content-editor/editor-mutation.domain'
import { saveLinksCollection } from '../links-cache'

export async function saveLinksCollectionAction(
  _previous: CollectionSaveState,
  formData: FormData,
): Promise<CollectionSaveState> {
  return saveCollectionForm(formData, 'links', saveLinksCollection)
}
