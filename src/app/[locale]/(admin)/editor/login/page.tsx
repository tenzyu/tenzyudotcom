import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import { resolvePageLocale } from '@/lib/intlayer/page'
import { EditorLogin } from '../_features/login'
import { hasEditorAdminSession } from '../_features/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editor Login',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditorLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const locale = await resolvePageLocale(params)
  const search = await searchParams

  if (await hasEditorAdminSession()) {
    redirect(getLocalizedUrl('/editor', locale))
  }

  return <EditorLogin locale={locale} error={search.error} />
}
