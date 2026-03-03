import type { YouTubeVideo } from '@/components/social/youtube-carousel'

export type SelfiesData = {
  id: string
  imageUrl: string
}

export const HOME_SELFIES: SelfiesData[] = [
  { id: '2028490126226264471', imageUrl: '/placeholder.svg' },
  { id: '2028101824994246820', imageUrl: '/placeholder.svg' },
  { id: '2021290058519806399', imageUrl: '/placeholder.svg' },
  { id: '2014212434240942405', imageUrl: '/placeholder.svg' },
  { id: '2000244564473549114', imageUrl: '/placeholder.svg' },
  { id: '1995756452284420100', imageUrl: '/placeholder.svg' },
]

export const HOME_VIDEOS: YouTubeVideo[] = [
  { id: 'tOWeLMJNYz4', title: 'Music 1', type: 'video' },
  { id: 'L7giMsyfFQQ', title: 'Music 2', type: 'video' },
  { id: 'uIxtjaSJZmA', title: 'Music 3', type: 'video' },
  { id: 'ksdvNgqOToQ', title: 'Music 4', type: 'video' },
]
