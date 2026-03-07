import { type Dictionary, t } from 'intlayer'

const blogPageContent = {
  key: 'page-blog',
  content: {
    metadata: {
      title: t({
        ja: 'ブログ',
        en: 'Blog',
      }),
      description: t({
        ja: 'osu! の記録、ツールやWeb技術、日常の気付きなどを書き残します。',
        en: 'Notes on osu!, tools, web tech, and daily observations.',
      }),
    },
    pagination: {
      ariaLabel: t({
        ja: 'ページネーション',
        en: 'pagination',
      }),
      previous: t({
        ja: '前へ',
        en: 'Previous',
      }),
      next: t({
        ja: '次へ',
        en: 'Next',
      }),
      previousAria: t({
        ja: '前のページへ',
        en: 'Go to previous page',
      }),
      nextAria: t({
        ja: '次のページへ',
        en: 'Go to next page',
      }),
      more: t({
        ja: '他のページ',
        en: 'More pages',
      }),
    },
  },
} satisfies Dictionary

export default blogPageContent
