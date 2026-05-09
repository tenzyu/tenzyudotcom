import { describe, expect, mock, test } from 'bun:test'

mock.module('intlayer', () => ({
  getIntlayer: () => ({
    title: {
      default: 'tenzyu.com',
    },
    shareTitle: 'share title',
    description: 'site description',
  }),
  getMultilingualUrls: () => ({
    en: '/en',
    ja: '/ja',
  }),
}))

const { buildSiteStructuredData } = await import('./site-structured-data')

describe('buildSiteStructuredData', () => {
  test('builds website and person graph entries', () => {
    const data = buildSiteStructuredData('en')

    expect(data['@context']).toBe('https://schema.org')
    expect(data['@graph']).toHaveLength(2)
    expect(data['@graph'][0]).toMatchObject({
      '@type': 'WebSite',
      inLanguage: 'en',
    })
    expect(data['@graph'][1]).toMatchObject({
      '@type': 'Person',
      name: 'tenzyu',
    })
  })
})
