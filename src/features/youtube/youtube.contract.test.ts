import { describe, expect, test } from 'bun:test'
import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
  normalizeYouTubeVideoId,
} from './youtube.contract'

describe('youtube.contract', () => {
  const videoId = 'dQw4w9WgXcQ'

  test('builds youtube-nocookie embed urls', () => {
    expect(buildYouTubeEmbedUrl(videoId, { autoplay: true })).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&playsinline=1&rel=0&modestbranding=1',
    )
  })

  test('builds thumbnail urls from validated ids', () => {
    expect(buildYouTubeThumbnailUrl(videoId)).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    )
  })

  test('rejects invalid video ids', () => {
    expect(() => {
      normalizeYouTubeVideoId('not-a-valid-id')
    }).toThrow('Invalid YouTube video id')
  })
})
