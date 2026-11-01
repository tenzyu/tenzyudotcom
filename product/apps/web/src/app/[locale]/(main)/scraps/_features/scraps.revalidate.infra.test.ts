import { describe, expect, test } from 'bun:test'
import {
  SCRAPS_INDEX_TAG,
  SCRAPS_PUBLIC_ROUTE_TEMPLATES,
  getLocalizedScrapDetailPaths,
  getLocalizedScrapListPaths,
  getScrapContentTag,
  getScrapEntryContentTag,
  planScrapEntryRevalidation,
  planScrapManifestRevalidation,
} from './scraps.revalidate.infra'

describe('scrap revalidation tags', () => {
  test('index tag matches the canonical content-tag scheme', () => {
    expect(SCRAPS_INDEX_TAG).toBe('content:scraps:index')
  })

  test('per-slug tag scheme is stable', () => {
    expect(getScrapContentTag('hello')).toBe('content:scraps:hello')
  })

  test('per-entry tag scheme is stable', () => {
    expect(getScrapEntryContentTag('hello', 'e1')).toBe(
      'content:scraps:hello:entry:e1',
    )
  })
})

describe('scrap revalidation paths', () => {
  test('list paths cover both locales', () => {
    expect(getLocalizedScrapListPaths().map((target) => target.path)).toEqual([
      '/ja/scraps',
      '/en/scraps',
    ])
  })

  test('detail paths cover both locales', () => {
    expect(
      getLocalizedScrapDetailPaths('hello').map((target) => target.path),
    ).toEqual(['/ja/scraps/hello', '/en/scraps/hello'])
  })
})

describe('planScrapEntryRevalidation', () => {
  test('includes index + per-slug + per-entry tags and list + detail paths', () => {
    const plan = planScrapEntryRevalidation('hello', 'e1')
    expect(plan.tags).toEqual([
      'content:scraps:index',
      'content:scraps:hello',
      'content:scraps:hello:entry:e1',
    ])
    expect(plan.paths.map((target) => target.path)).toEqual([
      '/ja/scraps',
      '/en/scraps',
      '/ja/scraps/hello',
      '/en/scraps/hello',
    ])
  })
})

describe('planScrapManifestRevalidation', () => {
  test('does not include any entry tag', () => {
    const plan = planScrapManifestRevalidation('hello')
    expect(plan.tags).toEqual(['content:scraps:index', 'content:scraps:hello'])
  })
})

describe('SCRAPS_PUBLIC_ROUTE_TEMPLATES', () => {
  test('contains locale list + detail route templates', () => {
    expect(SCRAPS_PUBLIC_ROUTE_TEMPLATES).toEqual([
      '/ja/scraps',
      '/ja/scraps/[slug]',
      '/en/scraps',
      '/en/scraps/[slug]',
    ])
  })
})
