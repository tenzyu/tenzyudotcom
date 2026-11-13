import { describe, expect, test } from 'bun:test'
import { normalizeTweetEntities } from './tweet-entities'

describe('syndication tweet entities', () => {
  test('supplies empty collections omitted by the syndication API', () => {
    expect(normalizeTweetEntities({})).toEqual({
      hashtags: [],
      user_mentions: [],
      urls: [],
      symbols: [],
    })
  })

  test('preserves media and real text entities', () => {
    const media = [
      {
        display_url: 'pic.twitter.com/example',
        expanded_url: 'https://x.com/example/photo/1',
        indices: [5, 10] satisfies [number, number],
        url: 'https://t.co/example',
      },
    ]
    const hashtags = [
      { indices: [0, 4] satisfies [number, number], text: 'osu' },
    ]
    const entities = normalizeTweetEntities({ media, hashtags })
    expect(entities.media).toBe(media)
    expect(entities.hashtags).toBe(hashtags)
    expect(entities.urls).toEqual([])
  })
})
