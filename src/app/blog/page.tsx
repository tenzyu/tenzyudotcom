import { BlogCard } from '@/components/blog/blog-card'
import { getBlogPosts } from '@/lib/blog'

export const dynamic = 'force-static'

export default async function Page() {
  const awaited_posts = await getBlogPosts()

  return (
    <main className="flex flex-col items-center p-4">
      <div className="container flex flex-col items-center gap-8 px-4 pt-8">
        <section className="container max-w-screen-md">
          <div className="flex flex-col gap-y-4">
            {awaited_posts.map((post) => (
              <BlogCard key={post.slug} {...post.metadata} slug={post.slug} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
