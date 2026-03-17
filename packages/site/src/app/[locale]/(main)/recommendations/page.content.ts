import { type Dictionary, t } from 'intlayer'
import type { RecommendationTabId } from '@/features/recommendations/recommendations.domain'

const recommendationsPageContent = {
  key: 'page-recommendations',
  content: {
    metadata: {
      title: t({
        ja: 'お気に入り',
        en: 'Favorites',
      }),
      description: t({
        ja: '好きな音楽や動画、日々のお気に入りをまとめています。',
        en: 'Music, videos, and other things I like.',
      }),
    },
    lead: t({
      ja: '好きな曲、繰り返し見ている動画、雰囲気ごと好きなチャンネルをまとめています。',
      en: 'A running list of songs, videos, and channels I keep returning to.',
    }),
    navLabel: t({
      ja: 'お気に入り',
      en: 'Favorites',
    }),
    navDescription: t({
      ja: '好きな音と動画。',
      en: 'Favorite music and videos.',
    }),
    tabs: {
      music: t({
        ja: '音楽',
        en: 'Music',
      }),
      channels: t({
        ja: 'チャンネル',
        en: 'Channels',
      }),
    } satisfies Record<RecommendationTabId, ReturnType<typeof t>>,
    sections: {
      youtubeChannels: {
        title: t({
          ja: 'おすすめの YouTube チャンネル',
          en: 'Recommended YouTube channels',
        }),
        description: t({
          ja: '見ていて空気感ごと好きになったチャンネル。',
          en: 'Channels I ended up liking for their whole vibe.',
        }),
      },
    },
    labels: {
      comment: t({
        ja: 'ひとことコメント',
        en: 'Quick comment',
      }),
      openVideo: t({
        ja: '動画を開く',
        en: 'Open video',
      }),
      views: t({
        ja: '再生数',
        en: 'Views',
      }),
      openChannel: t({
        ja: 'チャンネルを見る',
        en: 'Open channel',
      }),
    },
  },
} satisfies Dictionary

export default recommendationsPageContent
