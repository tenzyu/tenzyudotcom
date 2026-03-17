export type YouTubeChannelItem = {
  title: string
  handle: string
  url: string
  note: string
}

export type YouTubePlaylistItem = {
  id: string
  title: string
  note: string
  views: string
}

export type RecommendationsPageData = {
  channels: YouTubeChannelItem[]
  videos: YouTubePlaylistItem[]
}
