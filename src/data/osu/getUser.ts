import 'server-only'

import { type ApiInstance, createApi } from './createApi'

import type * as osu from 'osu-api-v2-js'

type GetUserParams = Parameters<ApiInstance['getUser']>
/**
 * Get user data from osu! API
 */
export async function getUser(
  ...params: GetUserParams
): Promise<osu.User.Extended> {
  try {
    const api = await createApi()
    const user = api.getUser(...params)

    return await user
  } catch (error) {
    console.error('Error fetching osu! user data:', error)
    throw new Error('Failed to fetch osu! user data')
  }
}
