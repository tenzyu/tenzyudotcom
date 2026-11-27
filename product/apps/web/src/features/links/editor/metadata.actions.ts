'use server'

import { readBoundedMetadataHtml } from './metadata-response'
import { hasEditorAdminSession } from '@/features/editor-auth/editor-session'

export async function fetchUrlMetadataAction(url: string) {
  if (!(await hasEditorAdminSession())) {
    return { error: 'Unauthorized' }
  }

  try {
    const target = new URL(url)
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
      return { error: 'Invalid URL' }
    }

    const response = await fetch(target, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      },
    })

    if (!response.ok) {
      await response.body?.cancel()
      return { error: 'Failed to fetch' }
    }

    const html = await readBoundedMetadataHtml(response)

    // Very basic title and description extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : ''

    const ogTitleMatch = html.match(/property="og:title" content="(.*?)"/i)
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : ''

    const ogDescriptionMatch = html.match(
      /property="og:description" content="(.*?)"/i,
    )
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
