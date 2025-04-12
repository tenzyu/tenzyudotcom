import 'server-only'

import * as osu from 'osu-api-v2-js'
import { OsuAPIError } from './utils'

const CLIENT_ID = Number(process.env.OSU_CLIENT_ID)
const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new OsuAPIError(
    'osu! API credentials are missing. Please set OSU_CLIENT_ID and OSU_CLIENT_SECRET environment variables.',
    500,
    'OSU_API_CREDENTIALS_MISSING',
  )
}

// APIインスタンスをキャッシュ
let apiInstance: osu.API | null = null

export const createApi = async () => {
  if (apiInstance) {
    return apiInstance
  }

  try {
    apiInstance = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET)
    return apiInstance
  } catch (error) {
    throw new OsuAPIError(
      'Failed to create osu! API instance',
      500,
      'OSU_API_INITIALIZATION_ERROR',
    )
  }
}

export type ApiInstance = Awaited<ReturnType<typeof createApi>>

// APIインスタンスのリセット（エラー時やテスト用）
export const resetApiInstance = () => {
  apiInstance = null
}
