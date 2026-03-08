// TODO: 自前実装じゃなくてラッパーを使ったほうがいいと思う

import 'server-only'

import { cache } from 'react'
import { env } from '@/config/env.contract'
import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.contract'
import { parseYouTubeVideoApiResponse } from './youtube.contract'

const fetchYouTubeVideoData = cache(
  async (videoId: string) => {
    const apiKey = env.youtubeDataApiKey
    if (!apiKey) return null

    try {
      const normalizedVideoId = normalizeYouTubeVideoId(
        videoId,
        'youtube api video id',
      )
      const url = new URL('https://www.googleapis.com/youtube/v3/videos')
      url.searchParams.set('part', 'snippet,statistics')
      url.searchParams.set('id', normalizedVideoId)
      url.searchParams.set('key', apiKey)

      const res = await fetch(url.toString(), {
        next: { revalidate: 60 * 60 },
      })
      if (!res.ok) return null

      return parseYouTubeVideoApiResponse(await res.json())
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
