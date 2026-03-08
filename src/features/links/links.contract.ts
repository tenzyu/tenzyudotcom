export type LinkCategory = 'Watch' | 'Social' | 'Build' | 'Legacy'

export type MyLink = {
  name: string
  id: string
  url: string
  shortenUrl: string
  icon: string
  category: LinkCategory
}

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

    const parsedUrl = new URL(link.url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error(`link url must be http(s): ${link.url}`)
    }

    if (shortUrls.has(link.shortenUrl)) {
      throw new Error(`Duplicate link shortenUrl: ${link.shortenUrl}`)
    }
    shortUrls.add(link.shortenUrl)

    if (urls.has(link.url)) {
      throw new Error(`Duplicate link url: ${link.url}`)
    }
    urls.add(link.url)
  }

  return links
}
