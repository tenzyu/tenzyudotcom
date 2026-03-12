import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.domain'

type LocalizedText = {
  ja: string
  en: string
}

export type RecommendationSourceVideoEntry = {
  kind: 'youtube-video'
  sourceUrl: string
  note: LocalizedText
  published?: boolean
}

export type RecommendationSourceChannelEntry = {
  kind: 'youtube-channel'
  title: string
  handle: string
  url: string
  note: LocalizedText
  published?: boolean
}

export type RecommendationSourceEntry =
  | RecommendationSourceVideoEntry
  | RecommendationSourceChannelEntry

export type RecommendationTabId = 'music' | 'channels'

export type RecommendationChannel = {
  title: string
  handle: string
  url: string
}

export type RecommendationVideo = {
  id: string
}

export type RecommendationTab = {
  id: RecommendationTabId
  disabled?: boolean
}

export function isRecommendationTabId(
  value: string | null,
): value is RecommendationTabId {
  return value === 'music' || value === 'channels'
}

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

function assertUniqueStrings(items: readonly string[], label: string) {
  const values = new Set<string>()

  for (const item of items) {
    if (values.has(item)) {
      throw new Error(`Duplicate ${label}: ${item}`)
    }
    values.add(item)
  }
}

export function defineRecommendationChannels<
  const T extends RecommendationChannel,
>(channels: readonly T[]): readonly T[] {
  assertUniqueStrings(
    channels.map((channel) =>
      normalizeExternalUrl(
        channel.url,
        `recommendation channel url (${channel.title})`,
      ),
    ),
    'recommendation channel url',
  )

  for (const channel of channels) {
    assertNonEmpty(channel.title, `recommendation channel title (${channel.title})`)
    assertNonEmpty(
      channel.handle,
      `recommendation channel handle (${channel.title})`,
    )
  }

  return channels
}

export function defineRecommendationVideos<const T extends RecommendationVideo>(
  videos: readonly T[],
): readonly T[] {
  assertUniqueStrings(
    videos.map((video) => video.id),
    'recommendation video id',
  )

  for (const video of videos) {
    normalizeYouTubeVideoId(video.id)
  }

  return videos
}

export function defineRecommendationTabs<const T extends RecommendationTab>(
  tabs: readonly T[],
): readonly T[] {
  assertUniqueStrings(
    tabs.map((tab) => tab.id),
    'recommendation tab id',
  )
  return tabs
}
