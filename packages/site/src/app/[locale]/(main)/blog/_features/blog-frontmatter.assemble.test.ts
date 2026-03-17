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
})
