import { type Dictionary, t } from 'intlayer'
import type {
  PublicRouteGroupId,
  PublicRouteId,
} from '@/features/site-navigation/public-routes.data'

const navigationTilesContent = {
  key: 'navigationTiles',
  content: {
    groups: {
      outputs: {
        title: t({
          ja: 'アウトプット',
          en: 'Outputs',
        }),
        subtitle: t({
          ja: 'いま作っているもの',
          en: 'What I do',
        }),
        items: {
          tools: {
            label: t({
              ja: 'ツール',
              en: 'Tools',
            }),
            description: t({
              ja: '自作ツールやスクリプト。',
              en: 'Handmade tools and scripts.',
            }),
          },
          blog: {
            label: t({
              ja: 'ブログ',
              en: 'Blog',
            }),
            description: t({
              ja: '書き留めたメモと記録。',
              en: 'Notes and logs I wrote down.',
            }),
          },
          portfolio: {
            label: t({
              ja: 'ポートフォリオ',
              en: 'Portfolio',
            }),
            description: t({
              ja: '採用担当の方はこちら。',
              en: 'For recruiters and collaborators.',
            }),
          },
          archives: {
            label: t({
              ja: 'アーカイブ',
              en: 'Archives',
            }),
            description: t({
              ja: '過去のログとまとめ。',
              en: 'Past logs and archives.',
            }),
          },
        },
      },
      externals: {
        title: t({
          ja: '外部リンク',
          en: 'Externals',
        }),
        subtitle: t({
          ja: '外部リソースへジャンプ',
          en: 'Jump to external resources',
        }),
        items: {
          links: {
            label: t({
              ja: 'リンク集',
              en: 'My Links',
            }),
            description: t({
              ja: '配信先と外部リンク集。',
              en: 'Streaming destinations and external links.',
            }),
          },
          puzzles: {
            label: t({
              ja: '謎解き',
              en: 'Solved Puzzles',
            }),
            description: t({
              ja: '解いた謎解きの記録。',
              en: 'Records of puzzles I solved.',
            }),
          },
          recommendations: {
            label: t({
              ja: 'お気に入り',
              en: 'Favorites',
            }),
            description: t({
              ja: '好きな音と動画。',
              en: 'Favorite music and videos.',
            }),
          },
          pointers: {
            label: t({
              ja: 'クイックアクセス',
              en: 'Quick access',
            }),
            description: t({
              ja: 'ブックマークみたいなもの。',
              en: 'Like a personal bookmark board.',
            }),
          },
        },
      },
    } satisfies Record<
      PublicRouteGroupId,
      {
        title: ReturnType<typeof t>
        subtitle: ReturnType<typeof t>
        items: Partial<
          Record<
            PublicRouteId,
            { label: ReturnType<typeof t>; description: ReturnType<typeof t> }
          >
        >
      }
    >,
  },
} satisfies Dictionary

export default navigationTilesContent
