import 'server-only'

import { cache } from 'react'
import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import {
  PUZZLES_OGP_FETCH_TIMEOUT_MS,
  PUZZLES_OGP_REVALIDATE_SECONDS,
} from './puzzles.cache-policy'

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
export const fetchOgp = cache(async (url: string): Promise<OgpData> => {
  const normalizedUrl = normalizeExternalUrl(url, 'OGP fetch url')

  try {
    const res = await fetch(normalizedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; OGPBot/1.0; +https://tenzyu.com)',
      },
      next: { revalidate: PUZZLES_OGP_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(PUZZLES_OGP_FETCH_TIMEOUT_MS),
    })

    if (!res.ok) return {}

    const html = await res.text()
    return parseOgpFromHtml(html)
  } catch {
    console.warn(`[OGP] Failed to fetch: ${normalizedUrl}`)
    return {}
  }
})

function parseOgpFromHtml(html: string): OgpData {
  const data: OgpData = {}

  const metaRegex =
    /<meta\s+[^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*/gi
  const metaRegexReverse =
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*/gi

  const metas = new Map<string, string>()

  const matches = html.matchAll(metaRegex)
  for (const match of matches) {
    metas.set(match[1].toLowerCase(), match[2])
  }

  const matchesReverse = html.matchAll(metaRegexReverse)
  for (const match of matchesReverse) {
    metas.set(match[2].toLowerCase(), match[1])
  }

  data.title = metas.get('og:title')
  data.description = metas.get('og:description')
  data.image = metas.get('og:image')
  data.siteName = metas.get('og:site_name')

  if (!data.title) {
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html)
    if (titleMatch) {
      data.title = titleMatch[1].trim()
    }
  }

  data.description ??= metas.get('description')

  return data
}
