import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import { resolvePageLocale } from '@/lib/intlayer/page'
import { EditorialLogin } from '../_features/login'
import { hasEditorialAdminSession } from '../_features/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editorial Login',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditorialLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const locale = await resolvePageLocale(params)
  const search = await searchParams

  if (await hasEditorialAdminSession()) {
    redirect(getLocalizedUrl('/editorial', locale))
  }

  return <EditorialLogin locale={locale} error={search.error} />
}
