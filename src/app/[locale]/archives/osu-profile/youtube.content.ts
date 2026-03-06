import { t, type Dictionary } from 'intlayer'

export type OsuProfileVideo = {
  id: string
  title: ReturnType<typeof t>
  type: 'video'
}

export type OsuProfileVideosContent = {
  personalBestHistory: OsuProfileVideo[]
  featuredVideos: OsuProfileVideo[]
}

const osuProfileVideosContent = {
  key: 'osuProfileVideos',
  content: {
    personalBestHistory: [
      {
        id: 'xpLVatdM_SA',
        title: t({
          ja: 'MY NEW TOP PLAY 590PP',
          en: 'MY NEW TOP PLAY 590PP',
        }),
        type: 'video',
      },
      {
        id: 'dAROJJlFYQY',
        title: t({
          ja: 'MY NEW TOP PLAY 465PP',
          en: 'MY NEW TOP PLAY 465PP',
        }),
        type: 'video',
      },
      {
        id: 'GhKEtFagPYE',
        title: t({
          ja: 'MY NEW TOP PLAY 460PP',
          en: 'MY NEW TOP PLAY 460PP',
        }),
        type: 'video',
      },
    ],
    featuredVideos: [
      {
        id: '9TCExaK1ZVM',
        title: t({
          ja: '【初心者向け】私のペンの持ち方・クリックの仕方を紹介します【TENZYU】#osu #osugame',
          en: 'Beginner Guide: How I hold my pen and click (TENZYU)',
        }),
        type: 'video',
      },
      {
        id: 'ieKX5r1NRzo',
        title: t({
          ja: 'ダイジェスト 4桁入りから自己ベスト更新まで【TENZYU/切り抜き】【osu!】',
          en: 'Digest: From entering 4 digits to a new personal best (TENZYU clip)',
        }),
        type: 'video',
      },
      {
        id: 'vykLwlk0NXg',
        title: t({
          ja: '【初心者向け】Stable と Lazer どちらで始めるべきか？【TENZYU】#osu #osugame',
          en: 'Beginner Guide: Should you start with Stable or Lazer?',
        }),
        type: 'video',
      },
      {
        id: 'T7Eqmn0pXuQ',
        title: t({
          ja: 'osu! のモチベの出し方とかプレイスタイルの決め方とか【TENZYU/切り抜き】【2024/9/14】',
          en: 'How to stay motivated and choose your playstyle (TENZYU clip)',
        }),
        type: 'video',
      },
      {
        id: 'c-G7vHbzb_M',
        title: t({
          ja: '最も簡単に星6のFCメダルを獲得する方法【osu!】',
          en: 'The easiest way to earn the 6-star FC medal (osu!)',
        }),
        type: 'video',
      },
    ],
  },
} satisfies Dictionary<OsuProfileVideosContent>

export default osuProfileVideosContent
