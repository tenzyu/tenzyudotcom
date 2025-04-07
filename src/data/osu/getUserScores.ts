import 'server-only'

import { type ApiInstance, createApi } from './createApi'

import type * as osu from 'osu-api-v2-js'


type GetUserScoresParams = Parameters<ApiInstance['getUserScores']>
/**
 * Get user's best scores from osu! API
 */

export const getUserScores = async (...params: GetUserScoresParams): Promise<
    osu.Score.WithUserBeatmapBeatmapset[]
> => {
    try {
        const api = await createApi()
        const bestScores = await api.getUserScores(...params)
        return bestScores
    } catch (error) {
        console.error('Error fetching osu! best scores:', error)
        throw new Error('Failed to fetch osu! best scores')
    }
}