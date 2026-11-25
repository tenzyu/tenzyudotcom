'use server'

import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import { isWritableEditorCollectionId } from '@/features/content-editor/editor-collections'
import { saveEditorCollection } from './editor.assemble'
import {
  parseEditorCollectionSaveInput,
  parseEditorLoginInput,
} from './editor-input.assemble'
import {
  type CollectionSaveState,
  editorMutationFailure,
} from '@/features/content-editor/editor-mutation.domain'
import {
  clearEditorAdminSession,
  checkEditorLoginRateLimit,
  clearEditorLoginRateLimit,
  createEditorAdminSession,
  requireEditorSameOriginRequest,
  requireEditorAdminSession,
  verifyEditorAdminPassword,
} from '@/features/editor-auth/editor-session'

export async function loginEditorAdminAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const parsed = parseEditorLoginInput({
    locale: formData.get('locale'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editor/login?error=invalid', 'ja'))
  }

  if (
    !(await checkEditorLoginRateLimit()) ||
    !verifyEditorAdminPassword(parsed.data.password)
  ) {
    // Artificial delay to deter brute force
    await new Promise((resolve) => setTimeout(resolve, 1000))
    redirect(getLocalizedUrl('/editor/login?error=invalid', parsed.data.locale))
  }

  await clearEditorLoginRateLimit()
  await createEditorAdminSession()
  redirect(getLocalizedUrl('/editor', parsed.data.locale))
}

export async function logoutEditorAdminAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const locale =
    typeof formData.get('locale') === 'string'
      ? (formData.get('locale') as string)
      : 'ja'
  await clearEditorAdminSession()
  redirect(getLocalizedUrl('/editor/login', locale))
}

export async function saveEditorCollectionAction(
  _previous: CollectionSaveState,
  formData: FormData,
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

  if (!isWritableEditorCollectionId(parsed.data.collectionId)) {
    return {
      status: 'error',
      error: 'invalid',
      message: 'This collection is not writable.',
    }
  }

  try {
    const result = await saveEditorCollection(
      parsed.data.collectionId,
      parsed.data.sourceJson,
      parsed.data.expectedVersion,
    )
    return { status: 'saved', version: result.version, message: 'Saved.' }
  } catch (error) {
    return editorMutationFailure(error)
  }
}
