import { type Dictionary, t } from 'intlayer'

const navigationTilesContent = {
  key: 'navigationTiles',
  content: {
    groups: [
      {
        title: t({
          ja: 'アウトプット',
          en: 'Outputs',
        }),
        subtitle: t({
          ja: 'いま作っているもの',
          en: 'What I do',
        }),
        items: [
          {
            href: '/tools',
            label: t({
              ja: 'ツール',
              en: 'Tools',
            }),
            description: t({
              ja: '自作ツールやスクリプト。',
              en: 'Handmade tools and scripts.',
            }),
          },
          {
            href: '/blog',
            label: t({
              ja: 'ブログ',
              en: 'Blog',
            }),
            description: t({
              ja: '書き留めたメモと記録。',
              en: 'Notes and logs I wrote down.',
            }),
          },
          {
            href: '/portfolio',
            label: t({
              ja: 'ポートフォリオ',
              en: 'Portfolio',
            }),
            description: t({
              ja: '採用担当の方はこちら。',
              en: 'For recruiters and collaborators.',
            }),
          },
          {
            href: '/archives',
            label: t({
              ja: 'アーカイブ',
              en: 'Archives',
            }),
            description: t({
              ja: '過去のログとまとめ。',
              en: 'Past logs and archives.',
            }),
          },
        ],
      },
      {
        title: t({
          ja: '外部リンク',
          en: 'Externals',
        }),
        subtitle: t({
          ja: '外部リソースへジャンプ',
          en: 'Jump to external resources',
        }),
        items: [
          {
            href: '/links',
            label: t({
              ja: 'リンク集',
              en: 'My Links',
            }),
            description: t({
              ja: '配信先と外部リンク集。',
              en: 'Streaming destinations and external links.',
            }),
          },
          {
            href: '/puzzles',
            label: t({
              ja: '謎解き',
              en: 'Solved Puzzles',
            }),
            description: t({
              ja: '解いた謎解きの記録。',
              en: 'Records of puzzles I solved.',
            }),
          },
          {
            href: '/recommendations',
            label: t({
              ja: 'お気に入り',
              en: 'Favorites',
            }),
            description: t({
              ja: '好きな音と動画。',
              en: 'Favorite music and videos.',
            }),
          },
          {
            href: '/pointers',
            label: t({
              ja: 'クイックアクセス',
              en: 'Quick access',
            }),
            description: t({
              ja: 'ブックマークみたいなもの。',
              en: 'Like a personal bookmark board.',
            }),
          },
        ],
      },
    ],
  },
} satisfies Dictionary

export default navigationTilesContent
