import { parseScrapIndexProjection } from '@tenzyu/publishing-domain/scraps-validation'
import type { ScrapEditorCommand } from './scrap-editor.validation'
import {
  type ScrapWorkspaceView,
  ScrapWorkspaceResult,
  ScrapWorkspaceViewSchema,
} from './scrap-workspace.validation'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'

const endpoint = '/api/editor/scrap'

async function read(path: string) {
  const response = await fetch(path, { cache: 'no-store' })
  if (response.status === 401)
    window.dispatchEvent(new Event('editor-session-invalid'))
  if (!response.ok) throw new Error('Unable to read the Scrap editor.')
  return response.json() as Promise<unknown>
}

export async function readPrivateScrapIndex() {
  return parseScrapIndexProjection(await read(endpoint))
}

export async function readPrivateScrap(slug: string) {
  return ScrapWorkspaceViewSchema.parse(
    await read(`${endpoint}?slug=${encodeURIComponent(slug)}`),
  )
}

export async function writeScrap(
  request:
    | { operation: 'save'; command: ScrapEditorCommand }
    | { operation: 'check'; candidate: string; expectedVersion?: string },
): Promise<ScrapWorkspaceResult> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    })
    if (response.status === 401)
      window.dispatchEvent(new Event('editor-session-invalid'))
    return ScrapWorkspaceResult.parse(await response.json())
  } catch {
    return {
      kind: 'uncertain',
      message: 'The save response was lost. Check Git before retrying.',
    }
  }
}

export async function verifiedPublicScrap(
  view: ScrapWorkspaceView,
  locale: string,
) {
  const path = buildLocalizedUrl(`/scraps/${view.manifest.slug}`, locale)
  try {
    const response = await fetch(path, {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      headers: { 'Accept-Language': locale === 'ja' ? 'ja' : 'en' },
    })
    if (!response.ok || new URL(response.url).pathname !== path) return false
    const page = new DOMParser().parseFromString(
      await response.text(),
      'text/html',
    )
    const article = page.querySelector('[data-scrap-revision]')
    return (
      page.documentElement.lang === locale &&
      article?.getAttribute('data-scrap-revision') === view.version &&
      article?.getAttribute('data-scrap-slug') === view.manifest.slug &&
      article.querySelector('h1')?.textContent?.trim() ===
        view.manifest.title &&
      !!article.querySelector('[data-scrap-lead]')?.firstChild &&
      page
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content') === view.manifest.title
    )
  } catch {
    return false
  }
}
