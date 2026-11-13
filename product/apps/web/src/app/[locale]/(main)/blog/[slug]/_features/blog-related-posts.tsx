import { useIntlayer } from 'next-intlayer/server'
import { BlogTile } from '../../_features/blog-tile'
import type { BlogListItem } from '../../_features/blog.assemble'

export function BlogRelatedPosts({
  posts,
  locale,
}: {
  posts: BlogListItem[]
  locale: string
}) {
  const content = useIntlayer('page-blog')

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {content.post.relatedTitle.value}
        </h2>
        <p className="text-muted-foreground text-sm">
          {content.post.relatedDescription.value}
        </p>
      </div>
      <div className="grid gap-4">
        {posts.map((post) => (
          <BlogTile
            key={post.slug}
            {...post.metadata}
            slug={post.slug}
            locale={locale}
            className="gap-2 p-4"
          />
        ))}
      </div>
    </section>
  )
}
