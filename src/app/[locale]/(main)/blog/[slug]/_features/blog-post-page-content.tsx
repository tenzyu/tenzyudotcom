import { useIntlayer } from 'next-intlayer/server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CustomMDX } from '../../_features/custom-mdx'
import { formatDate } from '../../_features/format-date'
import {
  type BlogPost,
  type BlogHeading,
  buildBlogPostStructuredData,
} from '../../_features/blog.assemble'
import { stripLeadingBlogTitle } from '../../_features/blog.domain'
import { BlogPostTableOfContents } from './blog-post-table-of-contents'
import { BlogRelatedPosts } from './blog-related-posts'
import { BlogSupportCard } from './blog-support-card'

type BlogPostPageContentProps = {
  locale: string
  post: BlogPost
  headings: BlogHeading[]
  relatedPosts: BlogPost[]
  isAiGenerated: boolean
}

export function BlogPostPageContent({
  locale,
  post,
  headings,
  relatedPosts,
  isAiGenerated,
}: BlogPostPageContentProps) {
  const content = useIntlayer('page-blog')
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const structuredData = buildBlogPostStructuredData(post, locale)
  const bodySource = stripLeadingBlogTitle(post.rawContent, post.metadata.title)

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
        <div className="space-y-5">
          <div>
            <h1 className="title text-3xl font-semibold tracking-tighter sm:text-4xl">
              {post.metadata.title}
            </h1>
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
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
            {post.metadata.tags && post.metadata.tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {post.metadata.tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="outline" className="font-medium">
                      #{tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {isAiGenerated ? (
            <Alert className="border-border/60 bg-card/70">
              <AlertTitle>{content.post.aiGeneratedTitle.value}</AlertTitle>
              <AlertDescription>
                <p>{content.post.aiGeneratedDescription.value}</p>
              </AlertDescription>
            </Alert>
          ) : null}

          <BlogPostTableOfContents headings={headings} />
        </div>

        <article className="prose prose-zinc dark:prose-invert max-w-none text-[1.02rem] leading-8 prose-headings:scroll-mt-24 prose-pre:overflow-x-auto prose-img:rounded-xl">
          <CustomMDX source={bodySource} />
        </article>

        <BlogSupportCard />
        <BlogRelatedPosts posts={relatedPosts} locale={locale} />
      </div>
    </>
  )
}
