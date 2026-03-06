import { t, type Dictionary } from 'intlayer'

const breadcrumbContent = {
  key: 'breadcrumb',
  content: {
    home: t({
      ja: 'ホーム',
      en: 'Home',
    }),
    labels: {
      blog: t({
        ja: 'ブログ',
        en: 'Blog',
      }),
      tools: t({
        ja: 'ツール',
        en: 'Tools',
      }),
      recommendations: t({
        ja: 'お気に入り',
        en: 'Favorites',
      }),
      pointers: t({
        ja: 'ポインタ',
        en: 'Pointers',
      }),
      links: t({
        ja: 'リンク集',
        en: 'Links',
      }),
      puzzles: t({
        ja: '謎解き',
        en: 'Puzzles',
      }),
      portfolio: t({
        ja: 'ポートフォリオ',
        en: 'Portfolio',
      }),
      archives: t({
        ja: 'アーカイブ',
        en: 'Archives',
      }),
      'osu-profile': t({
        ja: 'osu! プロフィール',
        en: 'osu! Profile',
      }),
      'dot-type': t({
        ja: 'Dot Type',
        en: 'Dot Type',
      }),
    },
  },
} satisfies Dictionary

export default breadcrumbContent
