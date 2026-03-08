import { getIntlayer, getMultilingualUrls } from 'intlayer'
import type { Metadata } from 'next'
import { BASE_URL, SITE_AUTHOR_NAME, SITE_METADATA_BASE } from '@/config/site'

export function buildSiteMetadata(locale: string): Metadata {
  const content = getIntlayer('site', locale)
  const multilingualUrls = getMultilingualUrls('/')
  const localizedUrl = multilingualUrls[locale as keyof typeof multilingualUrls]

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
      images: [],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
