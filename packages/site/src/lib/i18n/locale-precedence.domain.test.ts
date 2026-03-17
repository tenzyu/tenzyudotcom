import { describe, expect, test } from 'bun:test'
import {
  getLocaleFromPathname,
  resolveLocalePrecedence,
} from './locale-precedence.domain'

const locales = ['ja', 'en'] as const
const defaultLocale = 'ja'

describe('locale precedence', () => {
  test('prefers an explicit locale prefix in the URL over persisted locale and Accept-Language', () => {
    expect(
      resolveLocalePrecedence({
        pathname: '/en/blog',
        locales,
        defaultLocale,
        persistedLocale: 'ja',
        acceptLanguage: 'ja,en;q=0.8',
      }),
    ).toEqual({
      locale: 'en',
      source: 'path',
    })
  })

  test('prefers the persisted locale when the URL has no locale prefix', () => {
    expect(
      resolveLocalePrecedence({
        pathname: '/blog',
        locales,
        defaultLocale,
        persistedLocale: 'en',
        acceptLanguage: 'ja,en;q=0.8',
      }),
    ).toEqual({
      locale: 'en',
      source: 'persisted',
    })
  })

  test('falls back to Accept-Language only when there is no explicit user choice', () => {
    expect(
      resolveLocalePrecedence({
        pathname: '/blog',
        locales,
        defaultLocale,
        acceptLanguage: 'en-US,en;q=0.9,ja;q=0.7',
      }),
    ).toEqual({
      locale: 'en',
      source: 'accept-language',
    })
  })

  test('falls back to the configured default locale when no signal resolves', () => {
    expect(
      resolveLocalePrecedence({
        pathname: '/blog',
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'ja',
      source: 'default',
    })
  })

  test('detects locale prefixes only at the start of the pathname', () => {
    expect(getLocaleFromPathname('/en', locales)).toBe('en')
    expect(getLocaleFromPathname('/en/blog', locales)).toBe('en')
    expect(getLocaleFromPathname('/blog/en', locales)).toBeNull()
  })
})
