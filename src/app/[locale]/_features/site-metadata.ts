import { getIntlayer, getMultilingualUrls } from 'intlayer'
import type { Metadata } from 'next'
import {
  BASE_URL,
  buildOgTitleImageUrl,
  getAbsoluteUrl,
  SITE_AUTHOR_NAME,
  SITE_METADATA_BASE,
} from '@/config/site'

export function buildSiteMetadata(locale: string): Metadata {
  const content = getIntlayer('site', locale)
  const multilingualUrls = getMultilingualUrls('/')
  const localizedUrl = multilingualUrls[locale as keyof typeof multilingualUrls]
  const canonicalUrl = getAbsoluteUrl(localizedUrl ?? '/')
  const ogImage = buildOgTitleImageUrl(content.shareTitle)

  return {
    title: {
      template: content.title.template,
      default: content.title.default,
    },
    description: content.description,
    keywords: [],
    authors: [{ name: SITE_AUTHOR_NAME, url: BASE_URL }],
    creator: SITE_AUTHOR_NAME,
    publisher: SITE_AUTHOR_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: SITE_METADATA_BASE,
    alternates: {
      canonical: localizedUrl,
      languages: {
        ...multilingualUrls,
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: content.shareTitle,
      description: content.description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.shareTitle,
      description: content.description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
