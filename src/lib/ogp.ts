export type OgpData = {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

/**
 * Fetch Open Graph metadata from a URL.
 * Intended for use at build time (server-side only).
 */
export async function fetchOgp(url: string): Promise<OgpData> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; OGPBot/1.0; +https://tenzyu.com)',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return {}

    const html = await res.text()
    return parseOgpFromHtml(html)
  } catch {
    console.warn(`[OGP] Failed to fetch: ${url}`)
    return {}
  }
}

function parseOgpFromHtml(html: string): OgpData {
  const data: OgpData = {}

  const metaRegex =
    /<meta\s+[^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*/gi
  const metaRegexReverse =
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*/gi

  const metas = new Map<string, string>()

  let match: RegExpExecArray | null

  while ((match = metaRegex.exec(html)) !== null) {
    metas.set(match[1].toLowerCase(), match[2])
  }

  while ((match = metaRegexReverse.exec(html)) !== null) {
    metas.set(match[2].toLowerCase(), match[1])
  }

  data.title = metas.get('og:title')
  data.description = metas.get('og:description')
  data.image = metas.get('og:image')
  data.siteName = metas.get('og:site_name')

  // Fallback to regular title tag
  if (!data.title) {
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html)
    if (titleMatch) {
      data.title = titleMatch[1].trim()
    }
  }

  // Fallback to regular meta description
  data.description ??= metas.get('description')

  return data
}
