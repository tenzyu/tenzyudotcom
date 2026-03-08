import type { ReactNode } from 'react'

export type YouTubeChannelItem = {
  title: string
  handle: string
  url: string
  note: ReactNode
}

export type YouTubePlaylistItem = {
  id: string
  title: string
  note: ReactNode
  views: string
}

export type RecommendationsPageData = {
  channels: YouTubeChannelItem[]
  videos: YouTubePlaylistItem[]
}
