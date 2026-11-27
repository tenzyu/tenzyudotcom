import { describe, expect, test } from 'bun:test'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'

describe('parseBlogFrontmatter', () => {
  test('normalizes and deduplicates tags', () => {
    const metadata = parseBlogFrontmatter(
      {
        title: 'Post',
        summary: 'Summary',
        publishedAt: '2026-01-01',
        tags: ['AI', 'AI', ' tools '],
      },
      'post.mdx',
    )

    expect(metadata.tags).toEqual(['AI', 'tools'])
  })

  test('rejects updatedAt earlier than publishedAt', () => {
    expect(() =>
      parseBlogFrontmatter(
        {
          title: 'Post',
          summary: 'Summary',
          publishedAt: '2026-02-01',
          updatedAt: '2026-01-01',
        },
        'post.mdx',
      ),
    ).toThrow('updatedAt')
  })
  test('ignores unknown metadata and preserves optional fields', () => {
    const input = {
      title: 'Post',
      summary: 'Summary',
      publishedAt: new Date('2026-01-01'),
      image: null,
      updatedAt: null,
      tags: null,
      extra: { draft: true },
    }
    expect(parseBlogFrontmatter(input, 'post.mdx')).toEqual({
      title: 'Post',
      summary: 'Summary',
      publishedAt: input.publishedAt,
      image: undefined,
      updatedAt: undefined,
      tags: undefined,
    })
  })

  test('validates date order before tags', () => {
    expect(() =>
      parseBlogFrontmatter({
        title: 'Post',
        summary: 'Summary',
        publishedAt: '2026-02-01',
        updatedAt: '2026-01-01',
        tags: [1],
      }, 'post.mdx'),
    ).toThrow('updatedAt')
  })
})
