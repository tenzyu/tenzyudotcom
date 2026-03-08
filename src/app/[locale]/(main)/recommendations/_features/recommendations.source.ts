type LocalizedText = {
  ja: string
  en: string
}

export type RecommendationSourceVideoEntry = {
  kind: 'youtube-video'
  sourceUrl: string
  note: LocalizedText
  published?: boolean
}

export type RecommendationSourceChannelEntry = {
  kind: 'youtube-channel'
  title: string
  handle: string
  url: string
  note: LocalizedText
  published?: boolean
}

export type RecommendationSourceEntry =
  | RecommendationSourceVideoEntry
  | RecommendationSourceChannelEntry

export const RECOMMENDATION_SOURCE_ENTRIES: readonly RecommendationSourceEntry[] = [
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/tOWeLMJNYz4',
    note: {
      ja: '1:33 好きすぎる。集中力なくなって一日終わりだと思ったら聞いてます。',
      en: 'Love the 1:33 mark. I listen when my focus is gone and I feel like the day is over.',
    },
  },
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/L7giMsyfFQQ',
    note: {
      ja: '言葉遊び楽しいなと思って聞いていたらそういう楽曲投稿祭があったらしい。',
      en: 'I was enjoying the wordplay and found out there’s a song submission festival for that.',
    },
  },
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/uIxtjaSJZmA',
    note: {
      ja: '再生数が足りなさすぎる。',
      en: 'Way too few views for this one.',
    },
  },
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/ksdvNgqOToQ',
    note: {
      ja: '同じフレーズを繰り返すだけの曲探してます。',
      en: 'I’m looking for songs that just repeat the same phrase.',
    },
  },
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/ET04rrWSG4Y',
    note: {
      ja: '流行りの音楽とか全然聞いていなかったけど、話題になってたこの曲のライブ映像をみてみたら、元気づけられた。',
      en: 'I do not really keep up with trending music, but this live performance of a song people were talking about ended up cheering me up.',
    },
  },
  {
    kind: 'youtube-video',
    sourceUrl: 'https://youtu.be/iAG-tIDOris',
    note: {
      ja: 'だいぶ初期から見てる。',
      en: 'I have been watching this since pretty early on.',
    },
  },
  {
    kind: 'youtube-channel',
    title: 'お前も私も物理法則には逆らえないチャンネル',
    handle: '@お前も私も物理法則には逆ら',
    url: 'https://youtube.com/channel/UCH4GX_2KC9zEPAGvlfXHCiQ',
    note: {
      ja: '日本にいない日本人、知性を感じる振る舞い、メロいとはこういうことかも、良い。',
      en: 'Feels like a Japanese person who is somehow not in Japan. Intelligent presence, quietly magnetic, just good.',
    },
  },
]
