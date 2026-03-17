import { env } from '@/config/env.infra'

export const BASE_URL = env.siteUrl
export const SITE_NAME = 'tenzyu.com' as const
export const SITE_AUTHOR_NAME = 'tenzyu' as const
export const SITE_PUBLISHER_NAME = 'tenzyu.com' as const
export const SITE_LOGO_PATH = '/images/my-icon.png' as const
export const SITE_METADATA_BASE = new URL(BASE_URL)

export const getAbsoluteUrl = (path: string) =>
  new URL(path, SITE_METADATA_BASE).toString()

export const buildOgTitleImageUrl = (title: string) =>
  `${BASE_URL}/og?title=${encodeURIComponent(title)}`
