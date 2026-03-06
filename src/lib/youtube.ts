export async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )
    if (!res.ok) return 'Unknown'
    const data = await res.json()
    return data.title || 'Unknown'
  } catch (error) {
    return 'Unknown'
  }
}

export async function fetchYouTubeViewCount(
  videoId: string,
  locale: string = 'en-US',
): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
    if (!res.ok) return '—'
    const html = await res.text()
    const match = html.match(/"viewCount":"(\\d+)"/)
    if (!match) return '—'
    const count = Number(match[1])
    if (!Number.isFinite(count)) return '—'
    return new Intl.NumberFormat(locale).format(count)
  } catch (error) {
    return '—'
  }
}
