import { useIntlayer } from 'next-intlayer/server'
import { CustomMDX } from '../../_features/custom-mdx'
import { formatDate } from '../../_features/format-date'
import { type BlogPost, buildBlogPostStructuredData } from './lib/blog-post'

type BlogPostPageContentProps = {
  locale: string
  post: BlogPost
}

export function BlogPostPageContent({
  locale,
  post,
}: BlogPostPageContentProps) {
  const content = useIntlayer('page-blog')
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
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <time dateTime={post.metadata.publishedAt.toISOString()}>
              {formatDate(post.metadata.publishedAt, dateLocale)}
            </time>
            {post.metadata.updatedAt ? (
              <span>
                {content.pagination.updatedPrefix.value}{' '}
                {formatDate(post.metadata.updatedAt, dateLocale)}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {post.metadata.summary}
          </p>
          {post.metadata.tags && post.metadata.tags.length > 0 ? (
            <ul className="text-muted-foreground mt-4 flex flex-wrap gap-2 text-xs">
              {post.metadata.tags.map((tag) => (
                <li
                  key={tag}
                  className="bg-muted rounded-full px-2.5 py-1 font-medium"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <CustomMDX source={post.rawContent} />
        </article>
      </div>
    </>
  )
}
