import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

describe('locale proxy', () => {
  test('preserves an explicit Japanese choice across canonical redirects', () => {
    const response = proxy(new NextRequest('https://example.com/ja/tools?q=1', {
      headers: { cookie: 'INTLAYER_LOCALE=en', 'accept-language': 'en' },
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/tools?q=1')
    expect(response.cookies.get('INTLAYER_LOCALE')?.value).toBe('ja')
  })

  test('does not persist Japanese for a similarly named path', () => {
    const response = proxy(new NextRequest('https://example.com/japan'))
    expect(response.cookies.get('INTLAYER_LOCALE')).toBeUndefined()
  })
})
