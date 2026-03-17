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
    overview: {
      title: t({
        ja: '道具置き場',
        en: 'Tool shelf',
      }),
      description: t({
        ja: '日々の試行錯誤から生まれた、小さな実用品を置く棚です。数はまだ少ないですが、用途がはっきりしたものだけを置いていきます。',
        en: 'This is where small practical tools born from daily experiments will accumulate.',
      }),
      futureTitle: t({
        ja: '次に置きたいもの',
        en: 'Planned next',
      }),
      futureItems: [
        t({
          ja: 'テキスト整形や生成の小道具',
          en: 'Small text formatting and generation tools',
        }),
        t({
          ja: 'AI運用で使っている補助ツール',
          en: 'Support tools for AI workflows',
        }),
        t({
          ja: '個人的に使っている私家版ユーティリティ',
          en: 'Personal utilities I actually use',
        }),
      ],
    },
    support: {
      description: t({
        ja: 'この棚はゆっくり増やしています。役に立ったら、Blog を読むか、気が向いたときに支援してもらえると次を出しやすいです。',
        en: 'This shelf grows slowly. Support or feedback makes it easier to ship the next tool.',
      }),
      supportLabel: t({
        ja: 'Ko-fi で支援',
        en: 'Support on Ko-fi',
      }),
      readBlogLabel: t({
        ja: 'ブログも見る',
        en: 'Read the blog',
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
