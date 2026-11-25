import { requireEditorSameOriginRequest, requireEditorAdminSession } from '@/features/editor-auth/editor-session'
import { parseEditorCollectionSaveInput } from './editor-input.assemble'
import { type CollectionSaveState, editorMutationFailure } from './editor-mutation.domain'

// Shared transport validation; the calling feature owns the mutation.
export async function saveCollectionForm(
  formData: FormData,
  collectionId: 'notes' | 'links',
  save: (sourceJson: string, expectedVersion: string) => Promise<{ version: string }>,
): Promise<CollectionSaveState> {
  await requireEditorSameOriginRequest()
  await requireEditorAdminSession(formData.get('locale') === 'en' ? 'en' : 'ja')
  const parsed = parseEditorCollectionSaveInput({
    locale: formData.get('locale'),
    collectionId: formData.get('collectionId'),
    sourceJson: formData.get('sourceJson'),
    expectedVersion: formData.get('expectedVersion'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      error: 'invalid',
      message: 'The collection fields are invalid. Your draft has been kept.',
    }
  }

  if (parsed.data.collectionId !== collectionId) {
    return {
      status: 'error',
      error: 'invalid',
      message: 'This collection is not writable.',
    }
  }

  try {
    const result = await save(
      parsed.data.sourceJson,
      parsed.data.expectedVersion,
    )
    return { status: 'saved', version: result.version, message: 'Saved.' }
  } catch (error) {
    return editorMutationFailure(error)
  }
}
