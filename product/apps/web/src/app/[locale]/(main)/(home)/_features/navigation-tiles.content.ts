import { type Dictionary, t } from 'intlayer'
import type { PublicRouteId } from '@/features/site-navigation/public-routes.data'

const navigationTilesContent = {
  key: 'navigationTiles',
  content: {
    items: {
      blog: {
        label: t({ ja: 'ブログ', en: 'Blog' }),
        description: t({
          ja: '技術、実装、試行錯誤についての文章。',
          en: 'Writing about engineering, implementation, and experiments.',
        }),
      },
      notes: {
        label: t({ ja: 'ノート', en: 'Notes' }),
        description: t({
          ja: '日々の気づきや、まだ短い考え。',
          en: 'Short observations and thoughts from day to day.',
        }),
      },
      scraps: {
        label: t({ ja: 'スクラップ', en: 'Scraps' }),
        description: t({
          ja: '調べたこと、試したこと。制作途中の記録。',
          en: 'Research, experiments, and work in progress.',
        }),
      },
      links: {
        label: t({ ja: 'リンク', en: 'Links' }),
        description: t({
          ja: '配信、動画、SNS。ほかの場所での活動。',
          en: 'Streams, videos, social profiles, and elsewhere on the web.',
        }),
      },
      tools: {
        label: t({ ja: 'ツール', en: 'Tools' }),
        description: t({
          ja: '自分でつくり、使っている小さな道具。',
          en: 'Small tools I build and use.',
        }),
      },
      osu: {
        label: t({ ja: 'osu!', en: 'osu!' }),
        description: t({
          ja: 'プロフィール、プレイ環境、osu! の記録。',
          en: 'My profile, setup, and time with osu!.',
        }),
      },
      portfolio: {
        label: t({ ja: 'ポートフォリオ', en: 'Portfolio' }),
        description: t({
          ja: 'エンジニアとしての経歴と制作物。',
          en: 'Engineering experience, projects, and work.',
        }),
      },
    } satisfies Record<
      PublicRouteId,
      { label: ReturnType<typeof t>; description: ReturnType<typeof t> }
    >,
  },
} satisfies Dictionary

export default navigationTilesContent
