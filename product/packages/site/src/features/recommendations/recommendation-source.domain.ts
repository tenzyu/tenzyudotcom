import {
  isYouTubeVideoId,
  normalizeYouTubeVideoId,
} from '@/features/youtube/youtube.domain'

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function normalizeRecommendationVideoSource(
  raw: string,
  label = 'recommendation video source',
) {
  assertNonEmpty(raw, label)

  if (isYouTubeVideoId(raw)) {
    return normalizeYouTubeVideoId(raw, label)
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`Invalid ${label}: ${raw}`)
  }

  const host = url.hostname.replace(/^www\./, '')
  let videoId: string | undefined

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0]
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com'
  ) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v') ?? undefined
    } else {
      const segments = url.pathname.split('/').filter(Boolean)
      if (
        segments[0] === 'shorts' ||
        segments[0] === 'embed' ||
        segments[0] === 'live'
      ) {
        videoId = segments[1]
      }
    }
  }

  if (!videoId) {
    throw new Error(`Invalid ${label}: ${raw}`)
  }

  return normalizeYouTubeVideoId(videoId, label)
}
