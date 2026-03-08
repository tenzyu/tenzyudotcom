import { describe, expect, test } from 'bun:test'
import { defineLinks } from './links.contract'

describe('defineLinks', () => {
  test('rejects duplicate short urls', () => {
    expect(() =>
      defineLinks([
        {
          name: 'A',
          id: '@a',
          url: 'https://example.com/a',
          shortenUrl: 'same',
          icon: 'a',
          category: 'Watch',
        },
        {
          name: 'B',
          id: '@b',
          url: 'https://example.com/b',
          shortenUrl: 'same',
          icon: 'b',
          category: 'Social',
        },
      ]),
    ).toThrow('Duplicate link shortenUrl: same')
  })
})
