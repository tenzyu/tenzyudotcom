import { describe, expect, test } from 'bun:test'
import { loadLiveOsuData } from './live-data'
import { OsuAPIError } from './utils'

describe('live osu data availability', () => {
  test('reports missing credentials as unavailable without throwing into the page', async () => {
    const result = await loadLiveOsuData(async () => {
      throw new OsuAPIError(
        'Missing osu credentials',
        500,
        'OSU_API_CREDENTIALS_MISSING',
      )
    })
    expect(result).toEqual({ status: 'unavailable' })
    expect(result).not.toHaveProperty('data')
  })

  test('keeps configured API failures visible instead of treating them as missing credentials', async () => {
    const error = new OsuAPIError(
      'Invalid OAuth credentials',
      401,
      'OSU_API_INITIALIZATION_ERROR',
    )
    await expect(loadLiveOsuData(() => Promise.reject(error))).rejects.toBe(
      error,
    )
    const unexpected = new Error('API offline')
    await expect(
      loadLiveOsuData(() => Promise.reject(unexpected)),
    ).rejects.toBe(unexpected)
  })

  test('returns the configured loader result without substituting current values', async () => {
    const apiResponse = {
      statistics: { global_rank: null, country_rank: null },
    }
    const result = await loadLiveOsuData(async () => apiResponse)
    expect(result.status).toBe('available')
    if (result.status !== 'available') throw new Error('API data was lost')
    expect(result.data).toBe(apiResponse)
  })

  test('keeps an empty API result distinct from an unavailable API', async () => {
    expect(await loadLiveOsuData(async () => [])).toEqual({
      status: 'available',
      data: [],
    })
  })
})
