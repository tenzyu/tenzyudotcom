import { defineLinks } from './links.contract'
import {
  LINK_CATEGORY_ORDER,
  type LinkCategory,
  type MyLink,
} from './links.source'
import { loadEditorialCollection } from '@/lib/editorial/storage'

export async function loadLinks() {
  return defineLinks(await loadEditorialCollection('links'))
}

export function getLinkShortUrlStaticParams() {
  return loadLinks().then((links) =>
    links.map((link) => ({
      shortUrl: link.shortenUrl,
    })),
  )
}

export async function getLinkByShortUrl(shortUrl: string) {
  const links = await loadLinks()
  return links.find((link) => link.shortenUrl === shortUrl)
}

export { LINK_CATEGORY_ORDER }
export type { LinkCategory, MyLink }
