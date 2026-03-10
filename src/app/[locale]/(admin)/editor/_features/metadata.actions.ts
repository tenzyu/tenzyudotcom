'use server'

import { requireEditorAdminSession } from './session'

export async function fetchUrlMetadataAction(url: string) {
  try {
    // Basic validation
    new URL(url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      },
    })

    if (!response.ok) {
      return { error: 'Failed to fetch' }
    }

    const html = await response.text()

    // Very basic title and description extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : ''

    const ogTitleMatch = html.match(/property="og:title" content="(.*?)"/i)
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : ''

    const ogDescriptionMatch = html.match(/property="og:description" content="(.*?)"/i)
    const ogDescription = ogDescriptionMatch ? ogDescriptionMatch[1] : ''

    const descriptionMatch = html.match(/name="description" content="(.*?)"/i)
    const description = descriptionMatch ? descriptionMatch[1] : ''

    return {
      title: ogTitle || title,
      description: ogDescription || description,
    }
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return { error: 'Invalid URL' }
  }
}
