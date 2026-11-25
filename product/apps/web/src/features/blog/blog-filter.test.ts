import { describe, expect, test } from 'bun:test'
import { filterBlogPostsByTag } from './blog.domain'

describe('blog tag filtering', () => {
  const posts = [
    {
      slug: 'one',
      metadata: {
        title: 'One',
        summary: '',
        publishedAt: new Date(),
        tags: ['osu!', 'AI generated'],
      },
    },
    {
      slug: 'two',
      metadata: {
        title: 'Two',
        summary: '',
        publishedAt: new Date(),
        tags: ['osu!'],
      },
    },
    {
      slug: 'three',
      metadata: { title: 'Three', summary: '', publishedAt: new Date() },
    },
  ]

  test('returns only posts with the selected tag', () => {
    expect(
      filterBlogPostsByTag(posts, 'AI generated').map((post) => post.slug),
    ).toEqual(['one'])
    expect(
      filterBlogPostsByTag(posts, 'osu!').map((post) => post.slug),
    ).toEqual(['one', 'two'])
    expect(filterBlogPostsByTag(posts, 'missing')).toEqual([])
  })

  test('returns all posts when no tag is selected', () => {
    expect(filterBlogPostsByTag(posts)).toEqual(posts)
  })
})
