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
          ja: '縦長と横長の大きい文字を素早く作るための道具。ちょっとした遊びに使えます。',
          en: 'A utility for quickly making large text in vertical or horizontal layouts.',
        }),
        href: '/tools/dot-type',
        icon: 'type',
      },
    ],
  },
} satisfies Dictionary

export default toolsPageContent
