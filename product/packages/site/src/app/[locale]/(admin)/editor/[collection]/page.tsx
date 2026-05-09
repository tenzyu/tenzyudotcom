import { notFound } from 'next/navigation'
import { resolvePageLocale } from '@/lib/intlayer/page'
import { EditorCollectionEditor } from '../_features/editor'
import { requireEditorAdminSession } from '../_features/editor-session'
import { isEditorCollectionId } from '../_features/editor-collections'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Editor Collection',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditorCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; collection: string }>
  searchParams: Promise<{
    saved?: string
    error?: string
    slug?: string
    create?: string
  }>
}) {
  const awaitedParams = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: awaitedParams.locale }),
  )
  const search = await searchParams

  await requireEditorAdminSession(locale)

  if (!isEditorCollectionId(awaitedParams.collection)) {
    notFound()
  }

  return (
    <EditorCollectionEditor
      locale={locale}
      collectionId={awaitedParams.collection}
      saved={search.saved === '1'}
      error={search.error}
      slug={search.slug}
      create={search.create === '1'}
    />
  )
}
