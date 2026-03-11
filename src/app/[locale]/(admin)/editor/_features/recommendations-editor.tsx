import { useIntlayer } from 'next-intlayer/server'
import { EDITOR_ADMIN_LOCALE } from '@/features/admin/constants'
import { normalizeRecommendationVideoSource } from '@/features/recommendations/recommendation-source.domain'
import type { RecommendationSourceEntry } from '@/features/recommendations/recommendations.domain'
import { fetchYouTubeVideoMeta } from '@/features/recommendations/youtube'
import { RecommendationsEditorClient } from './recommendations-editor-client'

export async function RecommendationsEditor({
  locale,
  entries,
  expectedVersion,
}: {
  locale: string
  entries: RecommendationSourceEntry[]
  expectedVersion: string
}) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)

  const previews = await Promise.all(
    entries.map(async (entry) => {
      if (entry.kind === 'youtube-channel') {
        return {
          title: entry.title,
          secondary: entry.handle,
        }
      }

      try {
        const videoId = normalizeRecommendationVideoSource(
          entry.sourceUrl,
          `recommendation video source (${entry.sourceUrl})`,
        )
        const meta = await fetchYouTubeVideoMeta(videoId, 'ja-JP')

        return {
          title: meta.title,
          secondary: meta.views,
        }
      } catch {
        return {
          title: 'Unknown',
        }
      }
    }),
  )

  return (
    <RecommendationsEditorClient
      initialEntries={entries}
      expectedVersion={expectedVersion}
      locale={locale}
      previews={previews}
      labels={{
        addVideo: content.recommendationsEditor.addVideo.value,
        addChannel: content.recommendationsEditor.addChannel.value,
        save: content.dashboard.saveLabel.value,
        published: content.recommendationsEditor.published.value,
        url: content.recommendationsEditor.url.value,
        titleField: content.recommendationsEditor.titleField.value,
        handleField: content.recommendationsEditor.handleField.value,
        noteJa: content.recommendationsEditor.noteJa.value,
        noteEn: content.recommendationsEditor.noteEn.value,
        moveUp: content.recommendationsEditor.moveUp.value,
        moveDown: content.recommendationsEditor.moveDown.value,
        remove: content.recommendationsEditor.remove.value,
        preview: content.recommendationsEditor.preview.value,
        autoFetched: content.recommendationsEditor.autoFetched.value,
        channelHint: content.recommendationsEditor.channelHint.value,
        videoType: content.recommendationsEditor.videoType.value,
        channelType: content.recommendationsEditor.channelType.value,
      }}
    />
  )
}
