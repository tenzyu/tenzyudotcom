import { type Dictionary, t } from 'intlayer'

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
      scraps: t({
        ja: 'スクラップ',
        en: 'Scraps',
      }),
      tools: t({
        ja: 'ツール',
        en: 'Tools',
      }),
      notes: t({ ja: 'ノート', en: 'Notes' }),
      links: t({
        ja: 'リンク集',
        en: 'Links',
      }),
      portfolio: t({
        ja: 'ポートフォリオ',
        en: 'Portfolio',
      }),
      osu: t({
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
