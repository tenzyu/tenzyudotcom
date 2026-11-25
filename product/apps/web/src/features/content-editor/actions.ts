'use server'

import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import { parseEditorLoginInput } from './editor-input.assemble'
import {
  clearEditorAdminSession,
  checkEditorLoginRateLimit,
  clearEditorLoginRateLimit,
  createEditorAdminSession,
  requireEditorSameOriginRequest,
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
