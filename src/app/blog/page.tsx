import { BlogCard } from '@/components/blog/blog-card'
import { PageHeader } from '@/components/common/page-header'
import { getBlogPosts } from '@/lib/blog'

export const dynamic = 'force-static'

export default async function Page() {
  const awaited_posts = await getBlogPosts()

  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8">
        <PageHeader
          title="Blog"
          description="技術的な知見や日常の記録などを書き残します。"
          className="px-4"
        />
        <div className="flex flex-col gap-y-4">
          {awaited_posts.map((post) => (
            <BlogCard key={post.slug} {...post.metadata} slug={post.slug} />
          ))}
        </div>
      </div>
    </main>
  )
}
