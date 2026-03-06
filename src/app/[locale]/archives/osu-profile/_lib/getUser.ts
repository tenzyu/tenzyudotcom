import 'server-only'

import type * as osu from 'osu-api-v2-js'

import { type ApiInstance, createApi } from './createApi'
import { handleOsuAPIError, withRetry } from './utils'

type GetUserParams = Parameters<ApiInstance['getUser']>
/**
 * Get user data from osu! API
 * @param params Parameters for the getUser API call
 * @returns User data with extended information
 */
export async function getUser(
  ...params: GetUserParams
): Promise<osu.User.Extended> {
  try {
    const api = await createApi()
    const user = await withRetry(() => api.getUser(...params))
    return user
  } catch (error) {
    return handleOsuAPIError(error)
  }
}
