'use server'

import { getLocalizedUrl } from 'intlayer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { StorageVersionConflictError } from '@/lib/content-store/content-store.domain'
import { isWritableEditorCollectionId } from '@/features/content-editor/editor-collections'
import {
  makeSaveEditorCollectionUseCase,
  makeSaveBlogPostUseCase,
} from './editor.assemble'
import {
  parseEditorBlogSaveInput,
  parseEditorCollectionSaveInput,
  parseEditorLoginInput,
  validateEditorBlogPostDates,
} from './editor-input.assemble'
import type { SaveBlogPostActionState } from './blog-save-form-state'
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

export async function saveEditorCollectionAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const parsed = parseEditorCollectionSaveInput({
    locale: formData.get('locale'),
    collectionId: formData.get('collectionId'),
    sourceJson: formData.get('sourceJson'),
    expectedVersion: formData.get('expectedVersion'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editor?error=invalid', 'ja'))
  }

  if (!isWritableEditorCollectionId(parsed.data.collectionId)) {
    redirect(getLocalizedUrl('/editor?error=invalid', parsed.data.locale))
  }

  await requireEditorAdminSession(parsed.data.locale)
  try {
    const saveUseCase = makeSaveEditorCollectionUseCase()
    await saveUseCase.execute(
      parsed.data.collectionId,
      parsed.data.sourceJson,
      parsed.data.expectedVersion,
    )
  } catch (error) {
    if (error instanceof StorageVersionConflictError) {
      redirect(
        getLocalizedUrl(
          `/editor/${parsed.data.collectionId}?error=conflict`,
          parsed.data.locale,
        ),
      )
    }

    redirect(
      getLocalizedUrl(
        `/editor/${parsed.data.collectionId}?error=save`,
        parsed.data.locale,
      ),
    )
  }

  revalidatePath(getLocalizedUrl('/editor', parsed.data.locale))
  revalidatePath(
    getLocalizedUrl(`/editor/${parsed.data.collectionId}`, parsed.data.locale),
  )

  redirect(
    getLocalizedUrl(
      `/editor/${parsed.data.collectionId}?saved=1`,
      parsed.data.locale,
    ),
  )
}

export async function saveBlogPostAction(
  _previousState: SaveBlogPostActionState,
  formData: FormData,
): Promise<SaveBlogPostActionState> {
  await requireEditorSameOriginRequest()
  const parsed = parseEditorBlogSaveInput({
    locale: formData.get('locale'),
    slug: formData.get('slug'),
    title: formData.get('title'),
    summary: formData.get('summary'),
    publishedAt: formData.get('publishedAt'),
    updatedAt: formData.get('updatedAt') || undefined,
    tags: formData.get('tags'),
    body: formData.get('body'),
    expectedVersion: formData.get('expectedVersion') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'invalid',
      message: 'Required blog fields are missing or invalid.',
    }
  }

  await requireEditorAdminSession(parsed.data.locale)

  const validatedDates = validateEditorBlogPostDates({
    publishedAt: parsed.data.publishedAt,
    updatedAt: parsed.data.updatedAt,
  })

  if (!validatedDates.success) {
    return {
      error: 'validation',
      message: validatedDates.message,
    }
  }

  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  const frontmatter = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    publishedAt: validatedDates.data.publishedAt,
    updatedAt: validatedDates.data.updatedAt,
    tags,
  }

  try {
    const saveUseCase = makeSaveBlogPostUseCase()
    await saveUseCase.execute(
      parsed.data.slug,
      frontmatter,
      parsed.data.body,
      parsed.data.expectedVersion,
    )

    revalidatePath(getLocalizedUrl('/blog', parsed.data.locale))
    revalidatePath(
      getLocalizedUrl(`/blog/${parsed.data.slug}`, parsed.data.locale),
    )
    revalidatePath(getLocalizedUrl(`/editor/blog`, parsed.data.locale))
  } catch (error) {
    if (error instanceof StorageVersionConflictError) {
      return {
        error: 'conflict',
        message:
          'This post has been modified by another session. Reload the latest state and retry.',
      }
    }
    console.error('Failed to save blog post:', error)
    return {
      error: 'save',
      message:
        'Failed to save the blog post or refresh the blog index in GitHub content storage.',
    }
  }

  redirect(getLocalizedUrl(`/editor/blog?saved=1`, parsed.data.locale))
}
