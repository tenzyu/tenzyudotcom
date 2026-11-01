import 'server-only'

import * as osu from 'osu-api-v2-js'
import { cache } from 'react'
import { getRequiredOsuApiCredentials } from '@/config/env.infra'

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

export const createApi = cache(async () => {
  try {
    const { clientId, clientSecret } = getOsuApiCredentials()
    return await osu.API.createAsync(clientId, clientSecret)
  } catch (error) {
    console.error(error)
    throw new OsuAPIError(
      'Failed to create osu! API instance',
      500,
      'OSU_API_INITIALIZATION_ERROR',
    )
  }
})

export type ApiInstance = Awaited<ReturnType<typeof createApi>>
