import {
  defineRecommendationChannels,
  defineRecommendationTabs,
  defineRecommendationVideos,
  type RecommendationTabId,
} from './recommendations.contract'

export type RecommendationChannelId = 'obey-physics'

export type RecommendationVideoId =
  | 'tOWeLMJNYz4'
  | 'L7giMsyfFQQ'
  | 'uIxtjaSJZmA'
  | 'ksdvNgqOToQ'
  | 'ET04rrWSG4Y'
  | 'iAG-tIDOris'

export const RECOMMENDATION_CHANNELS = defineRecommendationChannels([
  {
    id: 'obey-physics',
    title: 'お前も私も物理法則には逆らえないチャンネル',
    handle: '@お前も私も物理法則には逆ら',
    url: 'https://youtube.com/channel/UCH4GX_2KC9zEPAGvlfXHCiQ',
  },
]) satisfies ReadonlyArray<{
  id: RecommendationChannelId
  title: string
  handle: string
  url: string
}>

export const RECOMMENDATION_VIDEOS = defineRecommendationVideos([
  { id: 'tOWeLMJNYz4' },
  { id: 'L7giMsyfFQQ' },
  { id: 'uIxtjaSJZmA' },
  { id: 'ksdvNgqOToQ' },
  { id: 'ET04rrWSG4Y' },
  { id: 'iAG-tIDOris' },
]) satisfies ReadonlyArray<{
  id: RecommendationVideoId
}>

export const RECOMMENDATION_TABS = defineRecommendationTabs([
  { id: 'music' },
  { id: 'channels' },
]) satisfies ReadonlyArray<{
  id: RecommendationTabId
  disabled?: boolean
}>
