// TODO: 自前実装じゃなくてラッパーを使ったほうがいいと思う

import 'server-only'

import { cache } from 'react'
import { env } from '@/config/env.contract'

type YouTubeVideoData = {
  title: string
  viewCount?: number
}

type YouTubeApiResponse = {
  items?: Array<{
    snippet?: { title?: string }
    statistics?: { viewCount?: string }
  }>
}

const fetchYouTubeVideoData = cache(
  async (videoId: string): Promise<YouTubeVideoData | null> => {
    const apiKey = env.youtubeDataApiKey
    if (!apiKey) return null

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos')
      url.searchParams.set('part', 'snippet,statistics')
      url.searchParams.set('id', videoId)
      url.searchParams.set('key', apiKey)

      const res = await fetch(url.toString(), {
        next: { revalidate: 60 * 60 },
      })
      if (!res.ok) return null

      const data = (await res.json()) as YouTubeApiResponse
      const item = data.items?.[0]
      if (!item) return null

      const title = item.snippet?.title ?? 'Unknown'
      const viewCountRaw = item.statistics?.viewCount
      const viewCount = viewCountRaw ? Number(viewCountRaw) : undefined

      return {
        title,
        viewCount: Number.isFinite(viewCount) ? viewCount : undefined,
      }
    } catch {
      return null
    }
  },
)

function formatViewCount(count: number | undefined, locale: string) {
  if (!count || !Number.isFinite(count)) return '—'
  return new Intl.NumberFormat(locale).format(count)
}

export async function fetchYouTubeVideoMeta(
  videoId: string,
  locale: string = 'en-US',
): Promise<{ title: string; views: string }> {
  const data = await fetchYouTubeVideoData(videoId)
  return {
    title: data?.title ?? 'Unknown',
    views: formatViewCount(data?.viewCount, locale),
  }
}
