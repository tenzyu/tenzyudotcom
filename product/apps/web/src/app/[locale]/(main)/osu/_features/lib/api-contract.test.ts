import { afterAll, expect, mock, spyOn, test } from 'bun:test'
import { DEFAULT_SCORE_LIMIT, ID_OSU } from '../osu.source'
import { loadLiveOsuData } from './live-data'

let credentials: { clientId: number; clientSecret: string } | undefined
const profileResponse = {
  statistics: { global_rank: null, country_rank: null },
}
const scoresResponse: unknown[] = []
const getUserRequest = mock(async (..._args: unknown[]) => profileResponse)
const getScoresRequest = mock(async (..._args: unknown[]) => scoresResponse)
const authenticate = mock(async (..._args: unknown[]) => ({
  getUser: getUserRequest,
  getUserScores: getScoresRequest,
}))

mock.module('server-only', () => ({}))
mock.module('@/config/env.infra', () => ({
  getRequiredOsuApiCredentials: () => {
    if (!credentials) throw new Error('Credentials not configured')
    return credentials
  },
}))
mock.module('osu-api-v2-js', () => ({ API: { createAsync: authenticate } }))

const { getUser } = await import('./getUser')
const { getUserScores } = await import('./getUserScores')
const errors = spyOn(console, 'error').mockImplementation(() => {})
afterAll(() => errors.mockRestore())

test('missing credentials never authenticate or substitute a profile or scores', async () => {
  expect(await loadLiveOsuData(() => getUser(ID_OSU))).toEqual({
    status: 'unavailable',
  })
  expect(
    await loadLiveOsuData(() =>
      getUserScores(
        ID_OSU,
        'best',
        0,
        { lazer: true },
        { limit: DEFAULT_SCORE_LIMIT }
      )
    )
  ).toEqual({ status: 'unavailable' })
  expect(authenticate).not.toHaveBeenCalled()
  expect(getUserRequest).not.toHaveBeenCalled()
  expect(getScoresRequest).not.toHaveBeenCalled()
})

test('configured credentials use the SDK and preserve the real account and score request', async () => {
  credentials = { clientId: 1, clientSecret: 'test-only-sdk-boundary' }
  const profile = await loadLiveOsuData(() => getUser(ID_OSU))
  const scores = await loadLiveOsuData(() =>
    getUserScores(
      ID_OSU,
      'best',
      0,
      { lazer: true },
      { limit: DEFAULT_SCORE_LIMIT }
    )
  )

  expect(authenticate).toHaveBeenCalledWith(1, 'test-only-sdk-boundary')
  expect(getUserRequest).toHaveBeenCalledWith(23318599)
  expect(getScoresRequest).toHaveBeenCalledWith(
    23318599,
    'best',
    0,
    { lazer: true },
    { limit: 5 }
  )
  if (profile.status !== 'available' || scores.status !== 'available') {
    throw new Error('Configured API data was lost')
  }
  expect(Object.is(profile.data, profileResponse)).toBe(true)
  expect(Object.is(scores.data, scoresResponse)).toBe(true)
})
