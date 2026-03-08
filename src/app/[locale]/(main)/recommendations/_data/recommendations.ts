export type RecommendationChannelId = 'obey-physics'

export type RecommendationVideoId =
  | 'tOWeLMJNYz4'
  | 'L7giMsyfFQQ'
  | 'uIxtjaSJZmA'
  | 'ksdvNgqOToQ'
  | 'ET04rrWSG4Y'
  | 'iAG-tIDOris'

export const RECOMMENDATION_CHANNELS = [
  {
    id: 'obey-physics',
    title: 'お前も私も物理法則には逆らえないチャンネル',
    handle: '@お前も私も物理法則には逆ら',
    url: 'https://youtube.com/channel/UCH4GX_2KC9zEPAGvlfXHCiQ',
  },
] as const satisfies ReadonlyArray<{
  id: RecommendationChannelId
  title: string
  handle: string
  url: string
}>

export const RECOMMENDATION_VIDEOS = [
  { id: 'tOWeLMJNYz4' },
  { id: 'L7giMsyfFQQ' },
  { id: 'uIxtjaSJZmA' },
  { id: 'ksdvNgqOToQ' },
  { id: 'ET04rrWSG4Y' },
  { id: 'iAG-tIDOris' },
] as const satisfies ReadonlyArray<{
  id: RecommendationVideoId
}>
