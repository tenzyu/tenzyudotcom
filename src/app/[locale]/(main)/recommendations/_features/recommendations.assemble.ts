import { cache } from 'react'
import {
  defineRecommendationChannels,
  defineRecommendationTabs,
  defineRecommendationVideos,
  normalizeRecommendationVideoSource,
  recommendationsRepository,
} from './recommendations.contract'
import type {
  RecommendationSourceChannelEntry,
  RecommendationSourceEntry,
  RecommendationSourceVideoEntry,
} from './recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
import { fetchYouTubeVideoMeta } from './lib/youtube'
import type {
  RecommendationsPageData,
  YouTubeChannelItem,
  YouTubePlaylistItem,
} from './lib/types'

type EditorLocale = 'ja' | 'en'

function resolveEditorLocale(locale: string): EditorLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

function isPublished(entry: { published?: boolean }) {
  return entry.published !== false
}

function isRecommendationChannelEntry(
  entry: RecommendationSourceEntry,
): entry is RecommendationSourceChannelEntry {
  return entry.kind === 'youtube-channel'
}

function isRecommendationVideoEntry(
  entry: RecommendationSourceEntry,
): entry is RecommendationSourceVideoEntry {
  return entry.kind === 'youtube-video'
}

export class LoadRecommendationsUseCase {
  constructor(private repository: RecommendationsRepository) {}

  async execute(): Promise<{
    channels: readonly RecommendationSourceChannelEntry[]
    videos: readonly RecommendationSourceVideoEntry[]
  }> {
    const entries = await this.repository.loadAll()
    const channels = entries
      .filter(isRecommendationChannelEntry)
      .filter(isPublished)
    const videos = entries
      .filter(isRecommendationVideoEntry)
      .filter(isPublished)

    return {
      channels,
      videos,
    }
  }
}

export function makeLoadRecommendationsUseCase() {
  return new LoadRecommendationsUseCase(recommendationsRepository)
}

export const RECOMMENDATION_TABS = defineRecommendationTabs([
  { id: 'music' },
  { id: 'channels' },
])

const loadRecommendationSourceEntries = cache(async () => {
  const useCase = makeLoadRecommendationsUseCase()
  return useCase.execute()
})

function resolveLocalizedText(
  note:
    | RecommendationSourceVideoEntry['note']
    | RecommendationSourceChannelEntry['note'],
  locale: string,
) {
  const editorLocale = resolveEditorLocale(locale)
  return note[editorLocale] || note.ja
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
