import { type Dictionary, t } from 'intlayer'
import type { PrimaryNavRouteId } from '@/features/site-navigation/public-routes.data'

const shellContent = {
  key: 'shell',
  content: {
    skipToContent: t({
      ja: '本文へ移動',
      en: 'Skip to content',
    }),
    primaryNavLabel: t({
      ja: '主要ナビゲーション',
      en: 'Primary navigation',
    }),
    primaryNav: {
      blog: t({
        ja: 'ブログ',
        en: 'Blog',
      }),
      notes: t({
        ja: 'ノート',
        en: 'Notes',
      }),
      tools: t({
        ja: 'ツール',
        en: 'Tools',
      }),
      links: t({
        ja: 'リンク',
        en: 'Links',
      }),
      portfolio: t({
        ja: 'ポートフォリオ',
        en: 'Portfolio',
      }),
    } satisfies Record<PrimaryNavRouteId, ReturnType<typeof t>>,
    utilityNavLabel: t({
      ja: 'サイト設定',
      en: 'Site controls',
    }),
  },
} satisfies Dictionary

export default shellContent
