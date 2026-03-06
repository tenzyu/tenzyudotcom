import { t, type Dictionary } from 'intlayer'

const profileContent = {
  key: 'profile',
  content: {
    globalRanking: t({
      ja: '世界ランキング',
      en: 'Global Ranking',
    }),
    countryRanking: t({
      ja: '国別ランキング',
      en: 'Country Ranking',
    }),
    name: t({
      ja: '天珠 (テンジュ)',
      en: 'TENZYU',
    }),
    description: t({
      ja: 'osu! プレイヤー、ストリーマー、元プログラマー',
      en: 'osu! player, streamer, former programmer',
    }),
    goal: t({
      ja: 'osu! の日本一を目指しています。',
      en: 'Aiming to be the #1 osu! player in Japan.',
    }),
    twitchGoal: t({
      ja: 'Twitch Partner を目指しています。',
      en: 'Aiming to become a Twitch Partner.',
    }),
    funFacts: t({
      ja: 'ちょっとした話: ',
      en: 'Fun Facts: ',
    }),
    facts: {
      birthdate: t({
        ja: '2002年4月25日生まれです',
        en: 'Born on April 25, 2002',
      }),
      osuStart: t({
        ja: 'osu! は2021年の5月からプレイしています',
        en: 'Started playing osu! in May 2021',
      }),
      standingUp: t({
        ja: '立ちながら osu! をプレイしています',
        en: 'Standing while playing osu!',
      }),
    },
    loading: {
      gameplay: t({
        ja: 'プレイ映像を読み込み中...',
        en: 'Loading gameplay...',
      }),
    },
    aria: {
      videoPlayer: t({
        ja: 'ビデオプレイヤー',
        en: 'Video player',
      }),
      videoUnsupported: t({
        ja: 'お使いのブラウザは動画タグに対応していません。',
        en: 'Your browser does not support the video tag.',
      }),
      profileImageAlt: t({
        ja: '天珠のプロフィール画像',
        en: "Tenzyu's profile image",
      }),
      visitPrefix: t({
        ja: '開く',
        en: 'Visit',
      }),
      osuLogoAlt: t({
        ja: 'osu!のロゴ',
        en: 'osu! logo',
      }),
      twitchLogoAlt: t({
        ja: 'Twitchのロゴ',
        en: 'Twitch logo',
      }),
    },
  },
} satisfies Dictionary

export default profileContent
