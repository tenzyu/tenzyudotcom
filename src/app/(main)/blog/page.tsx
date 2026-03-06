import { BlogTile } from '@/components/features/blog/blog-tile'
import { PageHeader } from '@/components/site/page-header'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'osu! の記録、ツールやWeb技術、日常の気付きなどを書き残します。',
}

export default async function Page() {
  const awaited_posts = await getBlogPosts()

  return (
    <>
      <PageHeader
        title="Blog"
        description="osu! の記録、ツールやWeb技術、日常の気付きなどを書き残します。"
      />
      <div className="flex flex-col gap-y-4">
        {awaited_posts.map((post) => (
          <BlogTile key={post.slug} {...post.metadata} slug={post.slug} />
        ))}
      </div>
    </>
  )
}
