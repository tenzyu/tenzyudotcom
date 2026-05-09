import { fetchYouTubeVideoApiResponse } from './youtube.infra'

type YouTubeVideoData = {
  title: string
  viewCount?: number
}

type YouTubeApiItem = {
  snippet?: {
    title?: unknown
  }
  statistics?: {
    viewCount?: unknown
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseYouTubeApiItem(value: unknown): YouTubeApiItem | null {
  if (!isRecord(value)) {
    return null
  }

  const snippet = isRecord(value.snippet) ? value.snippet : undefined
  const statistics = isRecord(value.statistics) ? value.statistics : undefined

  return {
    snippet,
    statistics,
  }
}

export function parseYouTubeVideoApiResponse(raw: unknown): YouTubeVideoData | null {
  if (!isRecord(raw) || !Array.isArray(raw.items)) {
    return null
  }

  const item = parseYouTubeApiItem(raw.items[0])
  if (!item) {
    return null
  }

  const title =
    typeof item.snippet?.title === 'string' && item.snippet.title.trim()
      ? item.snippet.title
      : 'Unknown'

  const viewCountRaw = item.statistics?.viewCount
  const viewCount =
    typeof viewCountRaw === 'string' ? Number(viewCountRaw) : undefined

  return {
    title,
    viewCount: Number.isFinite(viewCount) ? viewCount : undefined,
  }
}

function formatViewCount(count: number | undefined, locale: string) {
  if (!count || !Number.isFinite(count)) return '—'
  return new Intl.NumberFormat(locale).format(count)
}

export async function fetchYouTubeVideoMeta(
  videoId: string,
  locale: string = 'en-US',
): Promise<{ title: string; views: string }> {
  const raw = await fetchYouTubeVideoApiResponse(videoId)
  const data = parseYouTubeVideoApiResponse(raw)
  return {
    title: data?.title ?? 'Unknown',
    views: formatViewCount(data?.viewCount, locale),
  }
}
