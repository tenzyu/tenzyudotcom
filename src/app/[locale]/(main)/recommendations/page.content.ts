import { type Dictionary, t } from 'intlayer'

const recommendationsPageContent = {
  key: 'page-recommendations',
  content: {
    metadata: {
      title: t({
        ja: 'お気に入り',
        en: 'Favorites',
      }),
      description: t({
        ja: '好きな音楽や動画、日々のお気に入りをまとめています。',
        en: 'Music, videos, and other things I like.',
      }),
      navLabel: t({
        ja: 'お気に入り',
        en: 'Favorites',
      }),
      navDescription: t({
        ja: '好きな音と動画。',
        en: 'Favorite music and videos.',
      }),
    },
    tabs: {
      music: t({
        ja: '音楽',
        en: 'Music',
      }),
      videos: t({
        ja: '動画 (準備中)',
        en: 'Videos (Soon)',
      }),
      socials: t({
        ja: 'SNS (準備中)',
        en: 'Socials (Soon)',
      }),
    },
    labels: {
      comment: t({
        ja: 'ひとことコメント',
        en: 'Quick comment',
      }),
      views: t({
        ja: '再生数',
        en: 'Views',
      }),
    },
    videos: [
      {
        id: 'tOWeLMJNYz4',
        note: t({
          ja: '1:33 好きすぎる。集中力なくなって一日終わりだと思ったら聞いてます。',
          en: 'Love the 1:33 mark. I listen when my focus is gone and I feel like the day is over.',
        }),
      },
      {
        id: 'L7giMsyfFQQ',
        note: t({
          ja: '言葉遊び楽しいなと思って聞いていたらそういう楽曲投稿祭があったらしい。',
          en: 'I was enjoying the wordplay and found out there’s a song submission festival for that.',
        }),
      },
      {
        id: 'uIxtjaSJZmA',
        note: t({
          ja: '再生数が足りなさすぎる。',
          en: 'Way too few views for this one.',
        }),
      },
      {
        id: 'ksdvNgqOToQ',
        note: t({
          ja: '同じフレーズを繰り返すだけの曲探してます。',
          en: 'I’m looking for songs that just repeat the same phrase.',
        }),
      },
    ],
  },
} satisfies Dictionary

export default recommendationsPageContent
