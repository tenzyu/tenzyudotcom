import { type Dictionary, t } from 'intlayer'

const homeContent = {
  key: 'page-home',
  content: {
    metadata: {
      title: t({
        ja: 'tenzyu | osu! とエンジニアリング',
        en: 'tenzyu | osu! & engineering',
      }),
      description: t({
        ja: 'osu! とソフトウェアづくり。天珠のブログ、ノート、制作の記録と、自作の道具をまとめています。',
        en: 'osu! and building software. Writing, notes, work in progress, and handmade tools by Tenzyu.',
      }),
    },
    introLead: t({ ja: '遊ぶ。つくる。書き残す。', en: 'Play. Build. Write.' }),
    introDetail: t({
      ja: '天珠です。osu! をプレイし、ソフトウェアをつくっています。プレイの記録も、実装で考えたことも、ここに書き残します。',
      en: "I'm Tenzyu. I play osu! and build software. This is where I write about the game, engineering, and what I learn along the way.",
    }),
    osuLink: t({ ja: 'osu! の記録', en: 'My osu! profile' }),
    workLink: t({ ja: '制作と仕事について', en: 'Work & projects' }),
    siteIndexTitle: t({ ja: 'このサイトを読む', en: 'Explore the site' }),
    siteIndexSubtitle: t({
      ja: '文章、制作途中の記録、自作の道具。',
      en: 'Writing, work in progress, and tools.',
    }),
    fragmentsTitle: t({ ja: '最近の記録', en: 'Recently written' }),
    fragmentsSubtitle: t({
      ja: 'ブログの新着記事と、日々の短いノート。',
      en: 'The latest blog post and short notes.',
    }),
    fragmentsNotesTitle: t({ ja: '最近のノート', en: 'Recent notes' }),
    fragmentsNotesLinkLabel: t({ ja: 'ノートを読む', en: 'Read the notes' }),
    fragmentsBlogTitle: t({ ja: '最近のブログ', en: 'Latest from the blog' }),
    fragmentsEmpty: t({
      ja: '新しい記録は、ブログとノートに掲載します。',
      en: 'New writing will appear in the blog and notes.',
    }),
  },
} satisfies Dictionary

export default homeContent
