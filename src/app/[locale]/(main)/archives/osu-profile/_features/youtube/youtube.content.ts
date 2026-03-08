import { type Dictionary, t } from 'intlayer'
import type { OsuProfileVideoId } from '../data/youtube'

export type OsuProfileVideosContent = {
  titles: Record<OsuProfileVideoId, ReturnType<typeof t>>
}

const osuProfileVideosContent = {
  key: 'osuProfileVideos',
  content: {
    titles: {
      xpLVatdM_SA: t({
        ja: 'MY NEW TOP PLAY 590PP',
        en: 'MY NEW TOP PLAY 590PP',
      }),
      dAROJJlFYQY: t({
        ja: 'MY NEW TOP PLAY 465PP',
        en: 'MY NEW TOP PLAY 465PP',
      }),
      GhKEtFagPYE: t({
        ja: 'MY NEW TOP PLAY 460PP',
        en: 'MY NEW TOP PLAY 460PP',
      }),
      '9TCExaK1ZVM': t({
        ja: '【初心者向け】私のペンの持ち方・クリックの仕方を紹介します【TENZYU】#osu #osugame',
        en: 'Beginner Guide: How I hold my pen and click (TENZYU)',
      }),
      ieKX5r1NRzo: t({
        ja: 'ダイジェスト 4桁入りから自己ベスト更新まで【TENZYU/切り抜き】【osu!】',
        en: 'Digest: From entering 4 digits to a new personal best (TENZYU clip)',
      }),
      vykLwlk0NXg: t({
        ja: '【初心者向け】Stable と Lazer どちらで始めるべきか？【TENZYU】#osu #osugame',
        en: 'Beginner Guide: Should you start with Stable or Lazer?',
      }),
      T7Eqmn0pXuQ: t({
        ja: 'osu! のモチベの出し方とかプレイスタイルの決め方とか【TENZYU/切り抜き】【2024/9/14】',
        en: 'How to stay motivated and choose your playstyle (TENZYU clip)',
      }),
      'c-G7vHbzb_M': t({
        ja: '最も簡単に星6のFCメダルを獲得する方法【osu!】',
        en: 'The easiest way to earn the 6-star FC medal (osu!)',
      }),
    },
  },
} satisfies Dictionary<OsuProfileVideosContent>

export default osuProfileVideosContent
