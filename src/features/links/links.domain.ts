import { normalizeExternalUrl } from '@/lib/url/external-url.domain'

export type LinkCategory = 'Watch' | 'Social' | 'Build' | 'Legacy'

export type MyLink = {
  name: string
  id: string
  url: string
  shortenUrl: string
  icon: string
  category: LinkCategory
}

export const LINK_CATEGORY_ORDER = [
  'Watch',
  'Social',
  'Build',
  'Legacy',
] as const satisfies readonly LinkCategory[]

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function defineLinks<const T extends MyLink>(
  links: readonly T[],
): readonly T[] {
  const shortUrls = new Set<string>()
  const urls = new Set<string>()

  for (const link of links) {
    assertNonEmpty(link.name, 'link name')
    assertNonEmpty(link.id, `link id (${link.name})`)
    assertNonEmpty(link.shortenUrl, `link shortenUrl (${link.name})`)

    const normalizedUrl = normalizeExternalUrl(link.url, `link url (${link.name})`)

    if (shortUrls.has(link.shortenUrl)) {
      throw new Error(`Duplicate link shortenUrl: ${link.shortenUrl}`)
    }
    shortUrls.add(link.shortenUrl)

    if (urls.has(normalizedUrl)) {
      throw new Error(`Duplicate link url: ${normalizedUrl}`)
    }
    urls.add(normalizedUrl)
  }

  return links
}
