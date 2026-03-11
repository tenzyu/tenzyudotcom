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
