'use server'

import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import {
  clearEditorAdminSession,
  requireEditorSameOriginRequest,
} from '@/features/editor-auth/editor-session'

export async function logoutEditorAdminAction(formData: FormData) {
  await requireEditorSameOriginRequest()
  const locale =
    typeof formData.get('locale') === 'string'
      ? (formData.get('locale') as string)
      : 'ja'
  await clearEditorAdminSession()
  redirect(getLocalizedUrl('/editor/login', locale))
}
