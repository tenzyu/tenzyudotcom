import { notFound } from 'next/navigation'
import type { EditorCollectionId } from '@/lib/editor/editor.port'
import { resolvePageLocale } from '@/lib/intlayer/page'
import { EditorCollectionEditor } from '../_features/editor'
import { requireEditorAdminSession } from '@/features/admin/session'

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

function isEditorCollectionId(
  value: string,
): value is EditorCollectionId {
  return (
    value === 'recommendations' ||
    value === 'notes' ||
    value === 'puzzles' ||
    value === 'pointers' ||
    value === 'links' ||
    value === 'blog'
  )
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
