'use server'

import { getLocalizedUrl } from 'intlayer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  EditorVersionConflictError,
} from '@/lib/editor/editor.port'
import {
  makeSaveBlogPostUseCase,
  makeSaveEditorCollectionUseCase,
} from './editor.assemble'
import {
  clearEditorAdminSession,
  createEditorAdminSession,
  hasEditorAdminSession,
  requireEditorAdminSession,
  verifyEditorAdminPassword,
} from './editor-session'

const LoginSchema = z.object({
  locale: z.string().trim().min(2),
  password: z.string().min(1),
})

const SaveCollectionSchema = z.object({
  locale: z.string().trim().min(2),
  collectionId: z.enum([
    'recommendations',
    'notes',
    'puzzles',
    'pointers',
    'links',
    'blog',
  ]),
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1).optional(),
})

const SaveBlogPostSchema = z.object({
  locale: z.string().trim().min(2),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  publishedAt: z.string().trim().min(1),
  updatedAt: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  body: z.string(),
  expectedVersion: z.string().trim().min(1).optional(),
})

export async function loginEditorAdminAction(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    locale: formData.get('locale'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editor/login?error=invalid', 'ja'))
  }

  if (!verifyEditorAdminPassword(parsed.data.password)) {
    // Artificial delay to deter brute force
    await new Promise((resolve) => setTimeout(resolve, 1000))
    redirect(
      getLocalizedUrl('/editor/login?error=invalid', parsed.data.locale),
    )
  }

  await createEditorAdminSession()
  redirect(getLocalizedUrl('/editor', parsed.data.locale))
}

export async function logoutEditorAdminAction(formData: FormData) {
  const locale =
    typeof formData.get('locale') === 'string'
      ? (formData.get('locale') as string)
      : 'ja'
  await clearEditorAdminSession()
  redirect(getLocalizedUrl('/editor/login', locale))
}

export async function saveEditorCollectionAction(formData: FormData) {
  const parsed = SaveCollectionSchema.safeParse({
    locale: formData.get('locale'),
    collectionId: formData.get('collectionId'),
    sourceJson: formData.get('sourceJson'),
    expectedVersion: formData.get('expectedVersion'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editor?error=invalid', 'ja'))
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
    if (error instanceof EditorVersionConflictError) {
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
    getLocalizedUrl(
      `/editor/${parsed.data.collectionId}`,
      parsed.data.locale,
    ),
  )

  redirect(
    getLocalizedUrl(
      `/editor/${parsed.data.collectionId}?saved=1`,
      parsed.data.locale,
    ),
  )
}

export async function saveInlineEditorCollectionAction(input: {
  locale: string
  collectionId: 'recommendations' | 'notes' | 'puzzles' | 'pointers' | 'links'
  sourceJson: string
  expectedVersion?: string
}) {
  const parsed = SaveCollectionSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false as const,
      error: 'invalid' as const,
    }
  }

  if (!(await hasEditorAdminSession())) {
    return {
      ok: false as const,
      error: 'unauthorized' as const,
    }
  }

  try {
    const saveUseCase = makeSaveEditorCollectionUseCase()
    const result = await saveUseCase.execute(
      parsed.data.collectionId,
      parsed.data.sourceJson,
      parsed.data.expectedVersion,
    )

    return {
      ok: true as const,
      version: result.version,
    }
  } catch (error) {
    if (error instanceof EditorVersionConflictError) {
      return {
        ok: false as const,
        error: 'conflict' as const,
      }
    }

    return {
      ok: false as const,
      error: 'save' as const,
    }
  }
}

export async function saveBlogPostAction(formData: FormData) {
  const parsed = SaveBlogPostSchema.safeParse({
    locale: formData.get('locale'),
    slug: formData.get('slug'),
    title: formData.get('title'),
    summary: formData.get('summary'),
    publishedAt: formData.get('publishedAt'),
    updatedAt: formData.get('updatedAt') || undefined,
    tags: formData.get('tags'),
    body: formData.get('body'),
    expectedVersion: formData.get('expectedVersion'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editor?error=invalid', 'ja'))
  }

  await requireEditorAdminSession(parsed.data.locale)

  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  const frontmatter = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    publishedAt: new Date(parsed.data.publishedAt),
    updatedAt: parsed.data.updatedAt ? new Date(parsed.data.updatedAt) : undefined,
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
    revalidatePath(getLocalizedUrl(`/blog/${parsed.data.slug}`, parsed.data.locale))
    revalidatePath(getLocalizedUrl(`/editor/blog`, parsed.data.locale))
  } catch (error) {
    if (error instanceof EditorVersionConflictError) {
      redirect(
        getLocalizedUrl(
          `/editor/blog?slug=${parsed.data.slug}&error=conflict`,
          parsed.data.locale,
        ),
      )
    }
    console.error('Failed to save blog post:', error)
    redirect(getLocalizedUrl(`/editor/blog?error=save`, parsed.data.locale))
  }

  redirect(getLocalizedUrl(`/editor/blog?saved=1`, parsed.data.locale))
}
