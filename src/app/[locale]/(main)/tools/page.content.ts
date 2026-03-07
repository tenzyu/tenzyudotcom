import { type Dictionary, t } from 'intlayer'

const toolsPageContent = {
  key: 'page-tools',
  content: {
    metadata: {
      title: t({
        ja: 'ツール',
        en: 'Tools',
      }),
      description: t({
        ja: '自作したツールや便利スクリプトの公開用ページ',
        en: 'A home for my tools and helpful scripts.',
      }),
    },
    labels: {
      comment: t({
        ja: 'ひとことコメント',
        en: 'Quick comment',
      }),
      openTool: t({
        ja: 'ツールを開く',
        en: 'Open tool',
      }),
    },
    tools: [
      {
        title: t({
          ja: 'Dot Type Generator',
          en: 'Dot Type Generator',
        }),
        description: t({
          ja: 'テキストをドット絵風のアスキーアートに変換するジェネレーター。',
          en: 'Generate dot-style ASCII art from text.',
        }),
        note: t({
          ja: '配信用の見た目を即席で変えたいときに、入力→調整→出力を最短で回すための道具。',
          en: 'Built to sprint through input → tweak → output when I need a quick visual shift.',
        }),
        href: '/tools/dot-type',
        icon: 'type',
      },
    ],
  },
} satisfies Dictionary

export default toolsPageContent
