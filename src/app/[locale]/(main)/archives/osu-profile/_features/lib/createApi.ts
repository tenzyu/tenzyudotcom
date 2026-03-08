import 'server-only'

import * as osu from 'osu-api-v2-js'
import { getRequiredOsuApiCredentials } from '@/config/env.contract'

import { OsuAPIError } from './utils'

let credentials: ReturnType<typeof getRequiredOsuApiCredentials> | undefined

const getOsuApiCredentials = () => {
  if (credentials) {
    return credentials
  }

  try {
    credentials = getRequiredOsuApiCredentials()
    return credentials
  } catch {
    throw new OsuAPIError(
      'osu! API credentials are missing. Please set OSU_CLIENT_ID and OSU_CLIENT_SECRET environment variables.',
      500,
      'OSU_API_CREDENTIALS_MISSING',
    )
  }
}

// APIインスタンスをキャッシュ
let apiInstance: osu.API | null = null

export const createApi = async () => {
  if (apiInstance) {
    return apiInstance
  }

  try {
    const { clientId, clientSecret } = getOsuApiCredentials()
    apiInstance = await osu.API.createAsync(clientId, clientSecret)
    return apiInstance
  } catch (error) {
    console.error(error)
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
