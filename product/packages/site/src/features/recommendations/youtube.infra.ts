import 'server-only'

import { cache } from 'react'
import { env } from '@/config/env.infra'
import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.domain'

const RECOMMENDATIONS_REVALIDATE_SECONDS = 60 * 60 * 24

export const fetchYouTubeVideoApiResponse = cache(
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
        next: { revalidate: RECOMMENDATIONS_REVALIDATE_SECONDS },
      })
      if (!res.ok) return null

      return await res.json()
    } catch {
      return null
    }
  },
)
