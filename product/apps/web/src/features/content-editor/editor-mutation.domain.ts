import { isEditorValidationError } from './editor.validation'
import {
  StorageCommitUncertainError,
  StorageVersionConflictError,
} from '@/lib/content-store/content-store.domain'

export type CollectionSaveState =
  | { status: 'idle' }
  | { status: 'saved'; version: string; message: string }
  | {
      status: 'error'
      error: 'invalid' | 'conflict' | 'save' | 'uncertain'
      message: string
    }

export function editorMutationFailure(
  error: unknown,
): Extract<CollectionSaveState, { status: 'error' }> {
  if (error instanceof StorageVersionConflictError)
    return {
      status: 'error',
      error: 'conflict',
      message:
        'Another session changed this content. Your draft is still here. Copy it before loading the latest version.',
    }
  if (error instanceof StorageCommitUncertainError)
    return { status: 'error', error: 'uncertain', message: error.message }
  if (isEditorValidationError(error))
    return {
      status: 'error',
      error: 'invalid',
      message:
        'Some fields are invalid. Your draft is still here. Check the values and retry.',
    }
  return {
    status: 'error',
    error: 'save',
    message:
      'Save failed. Your draft is still here. Retry after checking storage.',
  }
}
