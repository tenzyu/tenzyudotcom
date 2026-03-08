import { EditorialDashboard } from './_features/dashboard'
import { requireEditorialAdminSession } from './_features/session'
import { resolvePageLocale } from '@/lib/intlayer/page'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editorial Dashboard',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditorialDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  await requireEditorialAdminSession(locale)
  return <EditorialDashboard locale={locale} />
}
