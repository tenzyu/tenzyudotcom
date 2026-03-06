import { t, type Dictionary } from 'intlayer'

const recommendationsPageContent = {
  key: 'recommendationsPage',
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
          ja: '集中が切れた瞬間の空気を、静かに整え直してくれる一本。',
          en: 'Resets the room when focus starts to fray.',
        }),
      },
      {
        id: 'L7giMsyfFQQ',
        note: t({
          ja: '夜の作業前に流すと、音の温度がちょうどいい。',
          en: 'Nighttime workflow: warm, steady, just right.',
        }),
      },
      {
        id: 'uIxtjaSJZmA',
        note: t({
          ja: '考えが詰まったときの視点ずらしに効く。',
          en: 'A small nudge when my thoughts get stuck.',
        }),
      },
      {
        id: 'ksdvNgqOToQ',
        note: t({
          ja: '手を動かす日にちょうどいいテンポ感。',
          en: 'Tempo that keeps my hands moving.',
        }),
      },
    ],
  },
} satisfies Dictionary

export default recommendationsPageContent
