import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.domain'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import { z } from 'zod'
import { editorRepository } from '@/lib/editor/editor.contract'
import type {
  RecommendationChannel,
  RecommendationSourceEntry,
  RecommendationTab,
  RecommendationVideo,
} from './recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
import { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/recommendations'
export { isRecommendationTabId } from './recommendations.domain'
export { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/recommendations'
import { normalizeRecommendationVideoSource } from './recommendation-source.domain'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
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
    const { collection } = await editorRepository.loadState(
      RECOMMENDATIONS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const recommendationsRepository = new EditorRecommendationsRepository()
