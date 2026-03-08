'use server'

import { getLocalizedUrl } from 'intlayer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  env,
  getRequiredEditorialAdminCredentials,
} from '@/config/env.contract'
import type { RevalidatePathTarget } from '@/lib/editorial/registry'
import { getEditorialCollectionDescriptor } from '@/lib/editorial/registry'
import {
  EditorialVersionConflictError,
  saveEditorialCollection,
} from '@/lib/editorial/storage'
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
  ]),
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1).optional(),
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
    await saveEditorialCollection(
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

  const descriptor = getEditorialCollectionDescriptor(parsed.data.collectionId)

  for (const path of descriptor.publicPaths) {
    const target = path as RevalidatePathTarget
    const revalidateType = target.type
    if (revalidateType) {
      revalidatePath(target.path, revalidateType)
      continue
    }

    revalidatePath(target.path)
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
