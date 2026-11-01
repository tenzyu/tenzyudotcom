import { expect, test } from 'bun:test'
import { DEFAULT_SCORE_LIMIT, ID_OSU } from './osu.source'
import { TWEETS } from './twitter.source'
import {
  FEATURED_VIDEO_IDS,
  PERSONAL_BEST_HISTORY_VIDEO_IDS,
} from './youtube.source'

test('preserves the real osu account and live best-score limit', () => {
  expect(ID_OSU).toBe(23318599)
  expect(DEFAULT_SCORE_LIMIT).toBe(5)
})

test('preserves the personal-best history video references in order', () => {
  expect(PERSONAL_BEST_HISTORY_VIDEO_IDS).toEqual([
    'xpLVatdM_SA',
    'dAROJJlFYQY',
    'GhKEtFagPYE',
  ])
})

test('preserves the featured video references in order', () => {
  expect(FEATURED_VIDEO_IDS).toEqual([
    '9TCExaK1ZVM',
    'ieKX5r1NRzo',
    'vykLwlk0NXg',
    'T7Eqmn0pXuQ',
    'c-G7vHbzb_M',
  ])
})

test('preserves the historical clip references in order', () => {
  expect(TWEETS.map(({ id }) => id)).toEqual([
    '1917575188818067854',
    '1917569584091259145',
    '1908446073070419972',
    '1907723960483197243',
  ])
})
