import { getIntlayer } from 'intlayer'
import {
  RECOMMENDATION_CHANNELS,
  RECOMMENDATION_VIDEOS,
  type RecommendationChannelId,
  type RecommendationVideoId,
} from '../../_data/recommendations'
import type { YouTubeChannelItem } from '../youtube-channel-list'
import type { YouTubePlaylistItem } from '../youtube-playlist'
import { fetchYouTubeVideoMeta } from './youtube'

export type RecommendationsPageData = {
  channels: YouTubeChannelItem[]
  videos: YouTubePlaylistItem[]
}

export async function getRecommendationsPageData(
  locale: string,
): Promise<RecommendationsPageData> {
  const content = getIntlayer('page-recommendations', locale)
  const viewLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  const [videos, channels] = await Promise.all([
    Promise.all(
      RECOMMENDATION_VIDEOS.map(async (video) => {
        const { title, views } = await fetchYouTubeVideoMeta(
          video.id,
          viewLocale,
        )

        return {
          id: video.id,
          note: content.videoNotes[video.id as RecommendationVideoId],
          title,
          views,
        }
      }),
    ) as Promise<YouTubePlaylistItem[]>,
    Promise.resolve(
      RECOMMENDATION_CHANNELS.map((channel) => ({
        handle: channel.handle,
        note: content.channelNotes[channel.id as RecommendationChannelId],
        title: channel.title,
        url: channel.url,
      })),
    ) as Promise<YouTubeChannelItem[]>,
  ])

  return {
    channels,
    videos,
  }
}
