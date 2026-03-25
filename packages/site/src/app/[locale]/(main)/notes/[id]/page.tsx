import { getLocalizedUrl, locales } from 'intlayer'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intlayer/server'
import { buildOgTitleImageUrl, getAbsoluteUrl } from '@/config/site'
import {
  assembleNoteDetailPageData,
  getNoteStaticParams,
} from '../_features/notes.assemble'
import { NoteDetailPageContent } from './_features/note-detail-page-content'

export const dynamicParams = false

export async function generateStaticParams() {
  return getNoteStaticParams()
}

type Params = Promise<{
  id: string
}>

function createMetadataText(body: string) {
  const normalized = body.replace(/\s+/g, ' ').trim()
  return {
    title: normalized.slice(0, 72) || 'Note',
    description: normalized.slice(0, 160) || 'Short note',
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const locale = await getLocale()
  const { id } = await params
  const pageData = await assembleNoteDetailPageData(id, locale)

  if (!pageData) {
    return
  }

  const copy = createMetadataText(pageData.note.body)
  const localizedPath = getLocalizedUrl(`/notes/${id}`, locale)
  const canonicalUrl = getAbsoluteUrl(localizedPath)
  const ogImage = buildOgTitleImageUrl(copy.title)
  const alternateLanguages = Object.fromEntries(
    locales.map((localeItem) => [
      localeItem,
      getAbsoluteUrl(getLocalizedUrl(`/notes/${id}`, localeItem)),
    ]),
  )

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: copy.title,
      description: copy.description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [ogImage],
    },
  }
}

export default async function NoteDetailPage({ params }: { params: Params }) {
  const locale = await getLocale()
  const { id } = await params
  const pageData = await assembleNoteDetailPageData(id, locale)

  if (!pageData) {
    notFound()
  }

  return (
    <NoteDetailPageContent
      locale={locale}
      note={pageData.note}
      ancestors={pageData.ancestors}
      replies={pageData.replies}
    />
  )
}
