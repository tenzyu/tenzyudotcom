import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getLocale, IntlayerServerProvider } from 'next-intlayer/server'
import { buildOgTitleImageUrl } from '@/config/site'
import { loadPublication } from '@/lib/content-store/publication.assemble'
import {
  assembleScrapPage,
  buildScrapAlternateLanguages,
  buildScrapDetailUrl,
} from '../_features/scraps.assemble'
import { ScrapDetailPageContent } from './_features/scrap-detail-page-content'

type Params = Promise<{
  slug: string
}>

function clampDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.slice(0, 160)
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata | undefined> {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const page = await assembleScrapPage(await loadPublication(), slug, locale)
  if (!page) {
    return undefined
  }
  const entry = page.manifest

  const canonicalUrl = buildScrapDetailUrl(slug, locale)
  const alternateLanguages = buildScrapAlternateLanguages(
    slug,
    page.indexableLocales,
  )

  const ogImage = buildOgTitleImageUrl(entry.title)
  const description = clampDescription(
    entry.summary ?? entry.hypothesis ?? entry.title,
  )

  const robotsAllowsIndexing = page.pageIsIndexable

  return {
    title: entry.title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages:
        Object.keys(alternateLanguages).length > 0
          ? alternateLanguages
          : undefined,
    },
    robots: {
      index: robotsAllowsIndexing,
      follow: true,
      googleBot: {
        index: robotsAllowsIndexing,
        follow: true,
      },
    },
    openGraph: {
      type: 'article',
      title: entry.title,
      description,
      url: canonicalUrl,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: entry.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ScrapDetailPage({ params }: { params: Params }) {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const snapshot = await loadPublication()
  const page = await assembleScrapPage(snapshot, slug, locale)

  if (!page) {
    notFound()
  }

  return (
    <IntlayerServerProvider locale={locale}>
      <ScrapDetailPageContent
        locale={locale}
        page={page}
        revision={snapshot.version}
      />
    </IntlayerServerProvider>
  )
}
