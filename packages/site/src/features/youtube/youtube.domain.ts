const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

type BuildYouTubeEmbedUrlOptions = {
  autoplay?: boolean
  relatedVideos?: boolean
}

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function isYouTubeVideoId(value: string) {
  return YOUTUBE_VIDEO_ID_PATTERN.test(value)
}

export function normalizeYouTubeVideoId(
  raw: string,
  label = 'YouTube video id',
) {
  assertNonEmpty(raw, label)

  if (!isYouTubeVideoId(raw)) {
    throw new Error(`Invalid ${label}: ${raw}`)
  }

  return raw
}

export function buildYouTubeEmbedUrl(
  videoId: string,
  options: BuildYouTubeEmbedUrlOptions = {},
) {
  const normalizedVideoId = normalizeYouTubeVideoId(videoId)
  const url = new URL(
    `https://www.youtube-nocookie.com/embed/${normalizedVideoId}`,
  )

  url.searchParams.set('autoplay', options.autoplay ? '1' : '0')
  url.searchParams.set('playsinline', '1')
  url.searchParams.set('rel', options.relatedVideos ? '1' : '0')
  url.searchParams.set('modestbranding', '1')

  return url.toString()
}

export function buildYouTubeThumbnailUrl(
  videoId: string,
  quality: 'maxresdefault' | 'hqdefault' = 'maxresdefault',
) {
  const normalizedVideoId = normalizeYouTubeVideoId(videoId)
  return `https://img.youtube.com/vi/${normalizedVideoId}/${quality}.jpg`
}
