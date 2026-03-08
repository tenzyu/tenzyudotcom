import { type Dictionary, t } from 'intlayer'
import type {
  RecommendationChannelId,
  RecommendationVideoId,
} from './_features/recommendations.data'

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
    },
    navLabel: t({
      ja: 'お気に入り',
      en: 'Favorites',
    }),
    navDescription: t({
      ja: '好きな音と動画。',
      en: 'Favorite music and videos.',
    }),
    tabs: {
      music: t({
        ja: '音楽',
        en: 'Music',
      }),
      socials: t({
        ja: 'アカウント',
        en: ' Accounts',
      }),
      videos: t({
        ja: 'SNS',
        en: 'Socials',
      }),
    },
    sections: {
      youtubeChannels: {
        title: t({
          ja: 'おすすめの YouTube チャンネル',
          en: 'Recommended YouTube channels',
        }),
        description: t({
          ja: '見ていて空気感ごと好きになったチャンネル。',
          en: 'Channels I ended up liking for their whole vibe.',
        }),
      },
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
      openChannel: t({
        ja: 'チャンネルを見る',
        en: 'Open channel',
      }),
    },
    channelNotes: {
      'obey-physics': t({
        ja: '日本にいない日本人、知性を感じる振る舞い、メロいとはこういうことかも、良い。',
        en: 'Feels like a Japanese person who is somehow not in Japan. Intelligent presence, quietly magnetic, just good.',
      }),
    } satisfies Record<RecommendationChannelId, ReturnType<typeof t>>,
    videoNotes: {
      tOWeLMJNYz4: t({
        ja: '1:33 好きすぎる。集中力なくなって一日終わりだと思ったら聞いてます。',
        en: 'Love the 1:33 mark. I listen when my focus is gone and I feel like the day is over.',
      }),
      L7giMsyfFQQ: t({
        ja: '言葉遊び楽しいなと思って聞いていたらそういう楽曲投稿祭があったらしい。',
        en: 'I was enjoying the wordplay and found out there’s a song submission festival for that.',
      }),
      uIxtjaSJZmA: t({
        ja: '再生数が足りなさすぎる。',
        en: 'Way too few views for this one.',
      }),
      ksdvNgqOToQ: t({
        ja: '同じフレーズを繰り返すだけの曲探してます。',
        en: 'I’m looking for songs that just repeat the same phrase.',
      }),
      ET04rrWSG4Y: t({
        ja: '流行りの音楽とか全然聞いていなかったけど、話題になってたこの曲のライブ映像をみてみたら、元気づけられた。',
        en: 'I do not really keep up with trending music, but this live performance of a song people were talking about ended up cheering me up.',
      }),
      'iAG-tIDOris': t({
        ja: 'だいぶ初期から見てる。',
        en: 'I have been watching this since pretty early on.',
      }),
    } satisfies Record<RecommendationVideoId, ReturnType<typeof t>>,
  },
} satisfies Dictionary

export default recommendationsPageContent
