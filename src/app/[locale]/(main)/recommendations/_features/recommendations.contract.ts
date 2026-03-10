import {
  isYouTubeVideoId,
  normalizeYouTubeVideoId,
} from '@/features/youtube/youtube.contract'
import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'
import { editorRepository } from '@/lib/editor/editor.contract'
import type {
  RecommendationChannel,
  RecommendationSourceEntry,
  RecommendationTab,
  RecommendationVideo,
} from './recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
export { isRecommendationTabId } from './recommendations.domain'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().min(1),
})

const RecommendationSourceVideoEntrySchema = z.object({
  kind: z.literal('youtube-video'),
  sourceUrl: z.string().trim().min(1),
  note: LocalizedTextSchema,
  published: z.boolean().optional(),
})

const RecommendationSourceChannelEntrySchema = z.object({
  kind: z.literal('youtube-channel'),
  title: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  url: z.string().trim().min(1),
  note: LocalizedTextSchema,
  published: z.boolean().optional(),
})

const RecommendationSourceEntrySchema = z.discriminatedUnion('kind', [
  RecommendationSourceVideoEntrySchema,
  RecommendationSourceChannelEntrySchema,
])

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

function assertUniqueStrings(
  items: readonly string[],
  label: string,
) {
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
>(
  channels: readonly T[],
): readonly T[] {
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

export function normalizeRecommendationVideoSource(
  raw: string,
  label = 'recommendation video source',
) {
  assertNonEmpty(raw, label)

  if (isYouTubeVideoId(raw)) {
    return normalizeYouTubeVideoId(raw, label)
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`Invalid ${label}: ${raw}`)
  }

  const host = url.hostname.replace(/^www\./, '')
  let videoId: string | undefined

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0]
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com'
  ) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v') ?? undefined
    } else {
      const segments = url.pathname.split('/').filter(Boolean)
      if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
        videoId = segments[1]
      }
    }
  }

  if (!videoId) {
    throw new Error(`Invalid ${label}: ${raw}`)
  }

  return normalizeYouTubeVideoId(videoId, label)
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

export function parseRecommendationSourceEntries(raw: unknown) {
  const entries = z.array(RecommendationSourceEntrySchema).parse(raw)

  for (const entry of entries) {
    if (entry.kind === 'youtube-video') {
      normalizeRecommendationVideoSource(
        entry.sourceUrl,
        `recommendation video source (${entry.sourceUrl})`,
      )
      continue
    }

    normalizeExternalUrl(
      entry.url,
      `recommendation channel url (${entry.title})`,
    )
  }

  return entries
}

export class EditorRecommendationsRepository implements RecommendationsRepository {
  async loadAll(): Promise<readonly RecommendationSourceEntry[]> {
    const { collection } = await editorRepository.loadState('recommendations')
    return collection
  }
}

export const recommendationsRepository = new EditorRecommendationsRepository()
