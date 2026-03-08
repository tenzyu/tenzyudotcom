import { MY_LINKS } from '@/features/links/data'

const LINK_BY_SHORT_URL = new Map(
  MY_LINKS.map((link) => [link.shortenUrl, link] as const),
)

export function getLinkShortUrlStaticParams() {
  return MY_LINKS.map((link) => ({
    shortUrl: link.shortenUrl,
  }))
}

export function getLinkByShortUrl(shortUrl: string) {
  return LINK_BY_SHORT_URL.get(shortUrl)
}
