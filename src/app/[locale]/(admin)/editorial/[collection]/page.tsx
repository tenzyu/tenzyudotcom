import { notFound } from 'next/navigation'
import type { EditorialCollectionId } from '@/lib/editorial/editorial.port'
import { resolvePageLocale } from '@/lib/intlayer/page'
import { EditorialCollectionEditor } from '../_features/editor'
import { requireEditorialAdminSession } from '../_features/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editorial Collection',
    robots: {
      index: false,
      follow: false,
    },
  }
}

function isEditorialCollectionId(
  value: string,
): value is EditorialCollectionId {
  return (
    value === 'recommendations' ||
    value === 'notes' ||
    value === 'puzzles' ||
    value === 'pointers' ||
    value === 'links'
  )
}

export default async function EditorialCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; collection: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const awaitedParams = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: awaitedParams.locale }),
  )
  const search = await searchParams

  await requireEditorialAdminSession(locale)

  if (!isEditorialCollectionId(awaitedParams.collection)) {
    notFound()
  }

  return (
    <EditorialCollectionEditor
      locale={locale}
      collectionId={awaitedParams.collection}
      saved={search.saved === '1'}
      error={search.error}
    />
  )
}
