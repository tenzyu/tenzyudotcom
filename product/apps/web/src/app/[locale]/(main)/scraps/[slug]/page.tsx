import { getLocalizedUrl, locales } from 'intlayer'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intlayer/server'
import { buildOgTitleImageUrl, getAbsoluteUrl } from '@/config/site'
import {
  assembleScrapPage,
  getScrapStaticParams,
  loadScrapIndexCached,
} from '../_features/scraps.assemble'
import { isPublicScrap } from '../_features/scraps.domain'
import { ScrapDetailPageContent } from './_features/scrap-detail-page-content'

export const dynamicParams = false

export async function generateStaticParams() {
  return getScrapStaticParams()
}

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
  const locale = await getLocale()
  const { slug } = await params
  const projection = await loadScrapIndexCached()
  const entry = projection.find((candidate) => candidate.slug === slug)
  if (!entry || !isPublicScrap(entry)) {
    return undefined
  }

  const path = `/scraps/${slug}`
  const canonicalUrl = getAbsoluteUrl(getLocalizedUrl(path, locale))
  const indexableLocales = entry.indexableLocales

  const alternateLanguages = Object.fromEntries(
    locales
      .map((candidate) => candidate as string)
      .filter((candidate) =>
        (indexableLocales as readonly string[]).includes(candidate),
      )
      .map((candidate) => [
        candidate,
        getAbsoluteUrl(getLocalizedUrl(path, candidate)),
      ]),
  )

  const ogImage = buildOgTitleImageUrl(entry.title)
  const description = clampDescription(
    entry.summary ?? entry.hypothesis ?? entry.title,
  )

  const robotsAllowsIndexing = (indexableLocales as readonly string[]).includes(
    locale,
  )

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
  const locale = await getLocale()
  const { slug } = await params
  const page = await assembleScrapPage({
    slug,
    locale,
    audience: 'public',
  })

  if (!page) {
    notFound()
  }

  return <ScrapDetailPageContent locale={locale} page={page} />
}
