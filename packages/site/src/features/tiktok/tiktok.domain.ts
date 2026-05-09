const TIKTOK_EMBED_ORIGIN = 'https://www.tiktok.com'

export type TikTokVideoMetadata = {
  id: string
  title: string
  thumbnailUrl: string
  likeCount: number | null
  shareUrl: string
  embedUrl: string
  width: number | null
  height: number | null
}

export function buildTikTokVideoUrl(handle: string, id: string) {
  return `${TIKTOK_EMBED_ORIGIN}/@${handle}/video/${id}`
}

export function formatTikTokLikeCount(
  value: number | null,
  locale: string,
): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US').format(
    value,
  )
}

export function buildTikTokEmbedUrl(url: string) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('autoplay', '1')
    return parsed.toString()
  } catch {
    return url
  }
}
