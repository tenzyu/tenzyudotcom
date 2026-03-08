import { CustomMDX } from '../../_features/custom-mdx'
import { formatDate } from '../../_features/lib'
import { type BlogPost, buildBlogPostStructuredData } from '../_lib/blog-post'

type BlogPostPageContentProps = {
  locale: string
  post: BlogPost
}

export function BlogPostPageContent({
  locale,
  post,
}: BlogPostPageContentProps) {
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const structuredData = buildBlogPostStructuredData(post, locale)

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Injecting structured data for SEO
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="space-y-8">
        <div>
          <h1 className="title text-2xl font-semibold tracking-tighter">
            {post.metadata.title}
          </h1>
          <div className="text-muted-foreground mt-2 text-sm">
            {formatDate(post.metadata.publishedAt, dateLocale)}
          </div>
        </div>
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <CustomMDX source={post.rawContent} />
        </article>
      </div>
    </>
  )
}
