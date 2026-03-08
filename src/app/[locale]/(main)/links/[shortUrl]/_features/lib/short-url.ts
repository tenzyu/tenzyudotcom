import { MY_LINKS } from '@/features/links/data'

export function getLinkShortUrlStaticParams() {
  return MY_LINKS.map((link) => ({
    shortUrl: link.shortenUrl,
  }))
}

export function getLinkByShortUrl(shortUrl: string) {
  return MY_LINKS.find((link) => link.shortenUrl === shortUrl)
}
