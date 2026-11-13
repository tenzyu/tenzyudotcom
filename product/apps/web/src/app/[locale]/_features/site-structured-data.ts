import { getIntlayer, getMultilingualUrls } from 'intlayer'
import {
  BASE_URL,
  getAbsoluteUrl,
  SITE_AUTHOR_NAME,
  SITE_LOGO_PATH,
  SITE_PUBLISHER_NAME,
} from '@/config/site'

type Thing = {
  '@type': string
  [key: string]: unknown
}

type SiteJsonLd = {
  '@context': 'https://schema.org'
  '@graph': readonly Thing[]
}

export function buildSiteStructuredData(locale: string): SiteJsonLd {
  const site = getIntlayer('site', locale)
  const multilingualUrls = getMultilingualUrls('/')
  const localizedHomePath =
    multilingualUrls[locale as keyof typeof multilingualUrls] ?? '/'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: site.title.default,
        alternateName: site.shareTitle,
        description: site.description,
        url: getAbsoluteUrl(localizedHomePath),
        inLanguage: locale,
        publisher: {
          '@type': 'Organization',
          name: SITE_PUBLISHER_NAME,
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: getAbsoluteUrl(SITE_LOGO_PATH),
          },
        },
      },
      {
        '@type': 'Person',
        name: SITE_AUTHOR_NAME,
        url: BASE_URL,
        image: getAbsoluteUrl(SITE_LOGO_PATH),
      },
    ],
  }
}
