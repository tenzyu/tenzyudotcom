import { getIntlayer, getMultilingualUrls } from 'intlayer'
import type { Metadata } from 'next'

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
    authors: [{ name: 'tenzyu', url: 'https://tenzyu.com' }],
    creator: 'tenzyu',
    publisher: 'tenzyu',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://tenzyu.com'),
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
