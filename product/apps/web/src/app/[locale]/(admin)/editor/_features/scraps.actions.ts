'use server'

import { revalidatePath, updateTag } from 'next/cache'
import {
  requireEditorAdminSession,
  requireEditorSameOriginRequest,
} from '@/features/editor-auth/editor-session'
import { executeScrapEditorCommand } from '@/features/content-editor/scrap-editor.assemble'
import type { EditorMutationState } from '@/features/content-editor/scrap-editor.domain'
import { ScrapEditorCommandSchema } from '@/features/content-editor/scrap-editor.validation'
import { editorMutationFailure } from '@/features/content-editor/editor-mutation.domain'
import {
  planScrapEntryRevalidation,
  planScrapManifestRevalidation,
} from './scraps-revalidation.assemble'

export async function saveScrapAction(
  _previous: EditorMutationState,
  form: FormData,
): Promise<EditorMutationState> {
  await requireEditorSameOriginRequest()
  await requireEditorAdminSession(form.get('uiLocale') === 'en' ? 'en' : 'ja')
  const parsed = ScrapEditorCommandSchema.safeParse({
    kind: form.get('kind'),
    slug: form.get('slug'),
    locale: form.get('locale'),
    expectedVersion: form.get('expectedVersion'),
    title: form.get('title'),
    hypothesis: form.get('hypothesis'),
    summary: form.get('summary'),
    status: form.get('status'),
    tags: String(form.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    lead: form.get('lead'),
    published: form.get('published') === 'on',
    entryId: form.get('entryId'),
    entryKind: form.get('entryKind'),
    body: form.get('body'),
  })
  if (!parsed.success)
    return {
      status: 'error',
      error: 'invalid',
      message: parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('. '),
    }
  let saved: { version: string; slug: string }
  try {
    saved = await executeScrapEditorCommand(parsed.data)
  } catch (error) {
    return editorMutationFailure(error)
  }
  const plan =
    parsed.data.kind === 'append' || parsed.data.kind === 'edit-entry'
      ? planScrapEntryRevalidation(saved.slug, parsed.data.entryId)
      : planScrapManifestRevalidation(saved.slug)
  let message = 'Saved. Load the latest version before making another change.'
  try {
    for (const tag of plan.tags) updateTag(tag)
    for (const path of plan.paths) revalidatePath(path.path)
    revalidatePath('/[locale]/editor/scraps', 'page')
  } catch {
    message =
      'Saved to storage. Page refresh failed. Load the latest version before editing again.'
  }
  return { status: 'saved', message, ...saved }
}
