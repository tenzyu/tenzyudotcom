import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.contract'
import { normalizeExternalUrl } from '@/lib/url/external-url.contract'

export type RecommendationTabId = 'music' | 'channels'

type RecommendationChannel = {
  id: string
  title: string
  handle: string
  url: string
}

type RecommendationVideo = {
  id: string
}

type RecommendationTab = {
  id: RecommendationTabId
  disabled?: boolean
}

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

function assertUniqueIds<T extends { id: string }>(
  items: readonly T[],
  label: string,
) {
  const ids = new Set<string>()

  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`)
    }
    ids.add(item.id)
  }
}

export function defineRecommendationChannels<
  const T extends RecommendationChannel,
>(
  channels: readonly T[],
): readonly T[] {
  assertUniqueIds(channels, 'recommendation channel')

  for (const channel of channels) {
    assertNonEmpty(channel.title, `recommendation channel title (${channel.id})`)
    assertNonEmpty(channel.handle, `recommendation channel handle (${channel.id})`)

    normalizeExternalUrl(
      channel.url,
      `recommendation channel url (${channel.id})`,
    )
  }

  return channels
}

export function defineRecommendationVideos<const T extends RecommendationVideo>(
  videos: readonly T[],
): readonly T[] {
  assertUniqueIds(videos, 'recommendation video')

  for (const video of videos) {
    normalizeYouTubeVideoId(video.id)
  }

  return videos
}

export function defineRecommendationTabs<const T extends RecommendationTab>(
  tabs: readonly T[],
): readonly T[] {
  assertUniqueIds(tabs, 'recommendation tab')
  return tabs
}

export function isRecommendationTabId(
  value: string | null,
): value is RecommendationTabId {
  return value === 'music' || value === 'channels'
}
