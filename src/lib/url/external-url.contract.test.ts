import { describe, expect, test } from 'bun:test'
import {
  normalizeExternalUrl,
  parseExternalUrl,
} from './external-url.domain'

describe('external-url.contract', () => {
  test('accepts http(s) urls', () => {
    expect(parseExternalUrl('https://tenzyu.com').hostname).toBe('tenzyu.com')
    expect(normalizeExternalUrl('http://example.com')).toBe(
      'http://example.com/',
    )
  })

  test('rejects non-http protocols', () => {
    expect(() => {
      parseExternalUrl('mailto:test@example.com')
    }).toThrow('must use http(s)')
  })

  test('rejects empty values', () => {
    expect(() => {
      normalizeExternalUrl('   ', 'test url')
    }).toThrow('test url must not be empty')
  })
})
