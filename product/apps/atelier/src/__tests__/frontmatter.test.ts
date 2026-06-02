import { describe, expect, test } from 'bun:test'
import { parseFrontmatter } from '../core/frontmatter'

describe('parseFrontmatter', () => {
  test('parses harness frontmatter and keeps the body', () => {
    const parsed = parseFrontmatter([
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'id: knowledge.product-spec.atelier',
      'title: Atelier',
      'tags:',
      '  - atelier',
      'freshness:',
      '  source: authored',
      '---',
      '',
      '# Body',
    ].join('\n'))

    expect(parsed.error).toBeUndefined()
    expect(parsed.frontmatter?.id).toBe('knowledge.product-spec.atelier')
    expect(parsed.frontmatter?.tags).toEqual(['atelier'])
    expect(parsed.body).toContain('# Body')
  })

  test('reports invalid frontmatter without throwing', () => {
    const parsed = parseFrontmatter(['---', 'tags:', '  - ok', ' - broken', '---', '# Body'].join('\n'))

    expect(parsed.error).toBeString()
    expect(parsed.frontmatter).toBeNull()
  })

  test('treats markdown without a fence as body-only', () => {
    const parsed = parseFrontmatter('# Body')

    expect(parsed.error).toBeUndefined()
    expect(parsed.frontmatter).toBeNull()
    expect(parsed.body).toBe('# Body')
  })
})

