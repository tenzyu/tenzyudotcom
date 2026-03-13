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
      updatedPrefix: t({
        ja: '更新',
        en: 'Updated',
      }),
    },
    post: {
      tableOfContentsTitle: t({
        ja: '目次',
        en: 'Contents',
      }),
      tableOfContentsDescription: t({
        ja: '気になる見出しへすぐ飛べます。',
        en: 'Jump to the section you want.',
      }),
      relatedTitle: t({
        ja: '関連記事',
        en: 'Related posts',
      }),
      relatedDescription: t({
        ja: '同じタグを優先しつつ、近い流れの記事も混ぜています。',
        en: 'Prefers shared tags, then fills with nearby recent posts.',
      }),
      supportTitle: t({
        ja: 'この記録が役に立ったら',
        en: 'If this helped',
      }),
      supportDescription: t({
        ja: 'このサイトは個人で育てています。支援があると、記事やツールの更新を続けやすくなります。',
        en: 'This site is built by one person. Support makes it easier to keep writing and shipping tools.',
      }),
      supportLinkLabel: t({
        ja: 'Ko-fi で支援する',
        en: 'Support on Ko-fi',
      }),
      aiGeneratedTitle: t({
        ja: 'AI生成コンテンツ',
        en: 'AI-generated content',
      }),
      aiGeneratedDescription: t({
        ja: 'この記事は生成AIを使って作られた内容を含みます。実体験や一次情報と照らし合わせて読んでください。',
        en: 'This post includes AI-generated material. Read it against firsthand experience and primary sources.',
      }),
    },
  },
} satisfies Dictionary

export default blogPageContent
