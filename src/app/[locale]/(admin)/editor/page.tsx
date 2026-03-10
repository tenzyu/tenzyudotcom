import { EditorDashboard } from './_features/dashboard'
import { requireEditorAdminSession } from './_features/session'
import { resolvePageLocale } from '@/lib/intlayer/page'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editor Dashboard',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  await requireEditorAdminSession(locale)
  return <EditorDashboard locale={locale} />
}
