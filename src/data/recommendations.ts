export type LocalizedText = {
  ja: string
  en: string
}

export type RecommendationVideo = {
  id: string
  note: LocalizedText
}

export const RECOMMENDATION_VIDEOS: RecommendationVideo[] = [
  {
    id: 'tOWeLMJNYz4',
    note: {
      ja: '集中が切れた瞬間の空気を、静かに整え直してくれる一本。',
      en: 'Resets the room when focus starts to fray.',
    },
  },
  {
    id: 'L7giMsyfFQQ',
    note: {
      ja: '夜の作業前に流すと、音の温度がちょうどいい。',
      en: 'Nighttime workflow: warm, steady, just right.',
    },
  },
  {
    id: 'uIxtjaSJZmA',
    note: {
      ja: '考えが詰まったときの視点ずらしに効く。',
      en: 'A small nudge when my thoughts get stuck.',
    },
  },
  {
    id: 'ksdvNgqOToQ',
    note: {
      ja: '手を動かす日にちょうどいいテンポ感。',
      en: 'Tempo that keeps my hands moving.',
    },
  },
]
