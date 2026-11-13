import { type Dictionary, t } from 'intlayer'

const liveDataContent = {
  key: 'osu-live-data',
  content: {
    unavailable: t({
      ja: 'osu! APIのデータを取得できません。API認証情報が未設定か、一時的に利用できない可能性があります。デバイス設定とプレイの記録は引き続き閲覧できます。',
      en: 'osu! API data is unavailable. API credentials may be missing or the service may be temporarily unavailable. Device settings and play history are still available.',
    }),
    unranked: t({ ja: 'ランクなし', en: 'Unranked' }),
    noScores: t({
      ja: 'osu! APIからベストスコアが返されませんでした。',
      en: 'The osu! API returned no best scores.',
    }),
  },
} satisfies Dictionary

export default liveDataContent
