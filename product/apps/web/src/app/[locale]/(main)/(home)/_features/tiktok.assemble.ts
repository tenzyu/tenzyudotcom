import 'server-only'

import type { TikTokVideoMetadata } from '@/features/tiktok/tiktok.domain'
import { HOME_TIKTOK_VIDEOS } from './tiktok-video.source'

export type HomeTikTokCard = TikTokVideoMetadata

export async function loadHomeTikTokCards(): Promise<HomeTikTokCard[]> {
  return HOME_TIKTOK_VIDEOS
}
