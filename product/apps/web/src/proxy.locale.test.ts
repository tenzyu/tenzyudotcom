import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

describe('locale proxy', () => {
  test('does not rewrite locale roots to a trailing slash that redirects back', () => {
    const response = proxy(new NextRequest('https://example.com/en'))
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/en',
    )
  })

  test('rewrites the default locale internally without changing the public route', () => {
    const response = proxy(
      new NextRequest('https://example.com/links?q=1', {
        headers: { 'accept-language': 'ja' },
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/ja/links?q=1',
    )
  })

  test('preserves an explicit Japanese choice across canonical redirects', () => {
    const response = proxy(
      new NextRequest('https://example.com/ja/tools?q=1', {
        headers: { cookie: 'INTLAYER_LOCALE=en', 'accept-language': 'en' },
      }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://example.com/tools?q=1',
    )
    expect(response.cookies.get('INTLAYER_LOCALE')?.value).toBe('ja')
  })

  test('does not persist Japanese for a similarly named path', () => {
    const response = proxy(new NextRequest('https://example.com/japan'))
    expect(response.cookies.get('INTLAYER_LOCALE')).toBeUndefined()
  })
})
