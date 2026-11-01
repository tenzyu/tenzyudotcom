'use server'

import { getLocalizedUrl } from 'intlayer'
import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  requireEditorAdminSession,
  requireEditorSameOriginRequest,
} from '@/features/editor-auth/editor-session'
import type { RevalidatePathTarget } from '@/lib/content-store/content-store.domain'
import {
  applyAppendScrapEntry,
  applyEditScrapEntry,
  parseAppendScrapEntryInput,
  parseEditScrapEntryInput,
} from './scrap-admin.assemble'

function applyEntryRevalidation(plan: {
  tags: readonly string[]
  paths: readonly RevalidatePathTarget[]
}) {
  for (const tag of plan.tags) {
    try {
      updateTag(tag)
    } catch {
      revalidateTag(tag, 'max')
    }
  }
  for (const target of plan.paths) {
    if (target.type) {
      revalidatePath(target.path, target.type)
    } else {
      revalidatePath(target.path)
    }
  }
}

function resolveDetailRedirectPath(uiLocale: string | undefined, slug: string) {
  const localeForRedirect = uiLocale ?? 'ja'
  return getLocalizedUrl(`/scraps/${slug}`, localeForRedirect)
}

export async function appendScrapEntryAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const parsed = parseAppendScrapEntryInput({
    locale: formData.get('locale'),
    uiLocale: formData.get('uiLocale')?.toString(),
    scrapSlug: formData.get('scrapSlug'),
    entryId: formData.get('entryId'),
    kind: formData.get('kind') ?? 'note',
    body: formData.get('body'),
  })

  if (!parsed.success) {
    throw new Error(
      `Invalid append-entry payload: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')}`,
    )
  }

  await requireEditorAdminSession(parsed.data.uiLocale ?? parsed.data.locale)

  const plan = await applyAppendScrapEntry(parsed.data)
  applyEntryRevalidation(plan)
  redirect(
    resolveDetailRedirectPath(parsed.data.uiLocale, parsed.data.scrapSlug),
  )
}

export async function editScrapEntryAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const parsed = parseEditScrapEntryInput({
    locale: formData.get('locale'),
    uiLocale: formData.get('uiLocale')?.toString(),
    scrapSlug: formData.get('scrapSlug'),
    entryId: formData.get('entryId'),
    body: formData.get('body'),
  })
  if (!parsed.success) {
    throw new Error(
      `Invalid edit-entry payload: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')}`,
    )
  }

  await requireEditorAdminSession(parsed.data.uiLocale ?? parsed.data.locale)

  const plan = await applyEditScrapEntry(parsed.data)
  applyEntryRevalidation(plan)
  redirect(
    `${resolveDetailRedirectPath(parsed.data.uiLocale, parsed.data.scrapSlug)}#entry-${parsed.data.entryId}`,
  )
}
