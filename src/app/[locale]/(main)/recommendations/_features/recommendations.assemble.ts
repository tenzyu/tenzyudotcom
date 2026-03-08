import {
  defineRecommendationChannels,
  defineRecommendationTabs,
  defineRecommendationVideos,
  normalizeRecommendationVideoSource,
} from './recommendations.contract'
import type {
  RecommendationSourceChannelEntry,
  RecommendationSourceVideoEntry,
} from './recommendations.source'
import { fetchYouTubeVideoMeta } from './lib/youtube'
import type { RecommendationsPageData, YouTubeChannelItem, YouTubePlaylistItem } from './lib/types'
import { loadEditorialCollection } from '@/lib/editorial/storage'
import { cache } from 'react'

type EditorialLocale = 'ja' | 'en'

function resolveEditorialLocale(locale: string): EditorialLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

function isPublished(entry: { published?: boolean }) {
  return entry.published !== false
}

function isRecommendationChannelEntry(
  entry: RecommendationSourceChannelEntry | RecommendationSourceVideoEntry,
): entry is RecommendationSourceChannelEntry {
  return entry.kind === 'youtube-channel'
}

function isRecommendationVideoEntry(
  entry: RecommendationSourceChannelEntry | RecommendationSourceVideoEntry,
): entry is RecommendationSourceVideoEntry {
  return entry.kind === 'youtube-video'
}

export const RECOMMENDATION_TABS = defineRecommendationTabs([
  { id: 'music' },
  { id: 'channels' },
])

const loadRecommendationSourceEntries = cache(async () => {
  const entries = await loadEditorialCollection('recommendations')
  const channels = entries.filter(isRecommendationChannelEntry).filter(isPublished)
  const videos = entries.filter(isRecommendationVideoEntry).filter(isPublished)

  return {
    channels,
    videos,
  }
})

function resolveLocalizedText(
  note: RecommendationSourceVideoEntry['note'] | RecommendationSourceChannelEntry['note'],
  locale: string,
) {
  const editorialLocale = resolveEditorialLocale(locale)
  return note[editorialLocale] || note.ja
}

export async function assembleRecommendationsPageData(
  locale: string,
): Promise<RecommendationsPageData> {
  const { channels: channelEntries, videos: videoEntries } =
    await loadRecommendationSourceEntries()
  const channels = defineRecommendationChannels(
    channelEntries.map((entry) => ({
      title: entry.title,
      handle: entry.handle,
      url: entry.url,
    })),
  ) satisfies ReadonlyArray<{
    title: string
    handle: string
    url: string
  }>
  defineRecommendationVideos(
    videoEntries.map((entry) => ({
      id: normalizeRecommendationVideoSource(
        entry.sourceUrl,
        `recommendation video source (${entry.sourceUrl})`,
      ),
    })),
  )

  const viewLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  const [assembledVideos, assembledChannels] = await Promise.all([
    Promise.all(
      videoEntries.map(async (entry) => {
        const videoId = normalizeRecommendationVideoSource(
          entry.sourceUrl,
          `recommendation video source (${entry.sourceUrl})`,
        )
        const { title, views } = await fetchYouTubeVideoMeta(videoId, viewLocale)

        return {
          id: videoId,
          note: resolveLocalizedText(entry.note, locale),
          title,
          views,
        }
      }),
    ) as Promise<YouTubePlaylistItem[]>,
    Promise.resolve(
      channels.map((channel, index) => ({
        handle: channel.handle,
        note: resolveLocalizedText(channelEntries[index].note, locale),
        title: channel.title,
        url: channel.url,
      })),
    ) as Promise<YouTubeChannelItem[]>,
  ])

  return {
    channels: assembledChannels,
    videos: assembledVideos,
  }
}
