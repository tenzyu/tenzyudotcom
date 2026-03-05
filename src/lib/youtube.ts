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
