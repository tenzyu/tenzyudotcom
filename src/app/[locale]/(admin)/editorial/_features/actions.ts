'use server'

import { getLocalizedUrl } from 'intlayer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  env,
  getRequiredEditorialAdminCredentials,
} from '@/config/env.contract'
import {
  EditorialVersionConflictError,
  editorialRepository,
} from '@/lib/editorial/editorial.contract'
import {
  makeSaveEditorialCollectionUseCase,
} from './editorial.assemble'
import {
  clearEditorialAdminSession,
  createEditorialAdminSession,
  isValidEditorialAdminPassword,
  requireEditorialAdminSession,
} from './session'

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
})

export async function loginEditorialAdminAction(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    locale: formData.get('locale'),
    password: formData.get('password'),
  })

  if (!parsed.success || !env.editorialAdminPassword) {
    redirect(getLocalizedUrl('/editorial/login?error=invalid', 'ja'))
  }

  const { password } = getRequiredEditorialAdminCredentials()
  if (!isValidEditorialAdminPassword(parsed.data.password, password)) {
    // Artificial delay to deter brute force
    await new Promise((resolve) => setTimeout(resolve, 1000))
    redirect(
      getLocalizedUrl('/editorial/login?error=invalid', parsed.data.locale),
    )
  }

  await createEditorialAdminSession()
  redirect(getLocalizedUrl('/editorial', parsed.data.locale))
}

export async function logoutEditorialAdminAction(formData: FormData) {
  const locale =
    typeof formData.get('locale') === 'string'
      ? (formData.get('locale') as string)
      : 'ja'
  await clearEditorialAdminSession()
  redirect(getLocalizedUrl('/editorial/login', locale))
}

export async function saveEditorialCollectionAction(formData: FormData) {
  const parsed = SaveCollectionSchema.safeParse({
    locale: formData.get('locale'),
    collectionId: formData.get('collectionId'),
    sourceJson: formData.get('sourceJson'),
    expectedVersion: formData.get('expectedVersion'),
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editorial?error=invalid', 'ja'))
  }

  await requireEditorialAdminSession(parsed.data.locale)
  try {
    const saveUseCase = makeSaveEditorialCollectionUseCase()
    await saveUseCase.execute(
      parsed.data.collectionId,
      parsed.data.sourceJson,
      parsed.data.expectedVersion,
    )
  } catch (error) {
    if (error instanceof EditorialVersionConflictError) {
      redirect(
        getLocalizedUrl(
          `/editorial/${parsed.data.collectionId}?error=conflict`,
          parsed.data.locale,
        ),
      )
    }

    redirect(
      getLocalizedUrl(
        `/editorial/${parsed.data.collectionId}?error=save`,
        parsed.data.locale,
      ),
    )
  }

  revalidatePath(getLocalizedUrl('/editorial', parsed.data.locale))
  revalidatePath(
    getLocalizedUrl(
      `/editorial/${parsed.data.collectionId}`,
      parsed.data.locale,
    ),
  )

  redirect(
    getLocalizedUrl(
      `/editorial/${parsed.data.collectionId}?saved=1`,
      parsed.data.locale,
    ),
  )
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
  })

  if (!parsed.success) {
    redirect(getLocalizedUrl('/editorial?error=invalid', 'ja'))
  }

  await requireEditorialAdminSession(parsed.data.locale)

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
    await editorialRepository.saveBlogPost(
      parsed.data.slug,
      frontmatter,
      parsed.data.body,
    )

    revalidatePath(getLocalizedUrl('/blog', parsed.data.locale))
    revalidatePath(getLocalizedUrl(`/blog/${parsed.data.slug}`, parsed.data.locale))
    revalidatePath(getLocalizedUrl(`/editorial/blog`, parsed.data.locale))
  } catch (error) {
    console.error('Failed to save blog post:', error)
    redirect(getLocalizedUrl(`/editorial/blog?error=save`, parsed.data.locale))
  }

  redirect(getLocalizedUrl(`/editorial/blog?saved=1`, parsed.data.locale))
}
