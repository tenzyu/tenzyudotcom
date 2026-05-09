import {
  buildTikTokVideoUrl,
  type TikTokVideoMetadata,
} from '@/features/tiktok/tiktok.domain'

export const HOME_TIKTOK_HANDLE = 'flawinaffection'

export type TikTokVideoData = TikTokVideoMetadata

const createHomeTikTokVideo = (
  id: string,
  metadata: Partial<Omit<TikTokVideoMetadata, 'id' | 'shareUrl'>>,
): TikTokVideoData => {
  const shareUrl = buildTikTokVideoUrl(HOME_TIKTOK_HANDLE, id)

  return {
    id,
    title: metadata.title ?? '',
    thumbnailUrl: metadata.thumbnailUrl ?? '',
    likeCount: metadata.likeCount ?? null,
    shareUrl,
    embedUrl: metadata.embedUrl ?? shareUrl,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  }
}

export const HOME_TIKTOK_VIDEOS: TikTokVideoData[] = [
  createHomeTikTokVideo('7625816340238011656', {
    "title": "お前の彼氏寝取ってやったの",
    thumbnailUrl: 'https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ogb1DfgLEEZUQyrz5FpgFB7oQRRFA3KM2BfXJX~tplv-photomode-zoomcover:720:720.jpeg?dr=14555&x-expires=1775876400&x-signature=OOGNaZCKlp%2BU%2BmqZVYCr9YIFDuc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my&ftpl=1',
    likeCount: 12,
  }),
  createHomeTikTokVideo('7622360455452822802', {
    title: 'らぶびーむ！',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/oEvHWIBlV5A99ngBHYAIEiXIdiIQ4a8E7PcAi~tplv-tiktokx-origin.image?dr=14575&x-expires=1775876400&x-signature=799xZTdJfkcanFncS1z34K7G%2FgE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    likeCount: 32,
  }),
  createHomeTikTokVideo('', {}),
  createHomeTikTokVideo('', {}),
  createHomeTikTokVideo('', {}),
  createHomeTikTokVideo('', {}),
]
