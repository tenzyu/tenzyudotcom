import { describe, expect, test } from 'bun:test'
import { loadLiveOsuData } from './live-data'

describe('live osu data availability', () => {
  test('reports missing credentials as unavailable without throwing into the page', async () => {
    const result = await loadLiveOsuData(async () => {
      throw new Error('Missing osu credentials')
    })
    expect(result).toEqual({ status: 'unavailable' })
    expect(result).not.toHaveProperty('data')
  })

  test('reports a rejected API request as unavailable without fabricated scores', async () => {
    const result = await loadLiveOsuData(() =>
      Promise.reject(new Error('API offline'))
    )
    expect(result).toEqual({ status: 'unavailable' })
    expect(result).not.toHaveProperty('data')
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
