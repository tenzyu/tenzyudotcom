import 'server-only'

import type * as osu from 'osu-api-v2-js'

import { type ApiInstance, createApi } from './createApi'
import { handleOsuAPIError, withRetry } from './utils'

type GetUserScoresParams = Parameters<ApiInstance['getUserScores']>

/**
 * Get user's best scores from osu! API
 * @param params Parameters for the getUserScores API call
 * @returns Array of user's scores with beatmap and beatmapset information
 */
export const getUserScores = async (
  ...params: GetUserScoresParams
): Promise<osu.Score.WithUserBeatmapBeatmapset[]> => {
  try {
    const api = await createApi()
    const scores = await withRetry(() => api.getUserScores(...params))

    return scores
  } catch (error) {
    return handleOsuAPIError(error)
  }
}
