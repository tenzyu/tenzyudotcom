import { getLocalizedUrl } from 'intlayer'
import { useIntlayer } from 'next-intlayer/server'
import Link from 'next/link'
import { PageHeader } from '@/components/site/page-header'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@tenzyu/ui/pagination'
import { BlogTile } from './blog-tile'
import type { BlogListItem } from './blog.assemble'
import { BlogPageEditor } from './blog-page-editor'

type BlogPageContentProps = {
  currentPage: number
  locale: string
  pageItems: BlogListItem[]
  totalPages: number
  tag?: string
}

export async function BlogPageContent({
  currentPage,
  locale,
  pageItems,
  totalPages,
  tag,
}: BlogPageContentProps) {
  const content = useIntlayer('page-blog')

  const pageHref = (page: number) => {
    const query = new URLSearchParams()
    if (tag) query.set('tag', tag)
    if (page > 1) query.set('page', String(page))
    const href = `/blog${query.size ? `?${query}` : ''}`
    return getLocalizedUrl(href, locale)
  }

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />

      {tag ? (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">#{tag}</h2>
          <Link
            className="text-primary underline"
            href={getLocalizedUrl('/blog', locale)}
          >
            {locale === 'ja' ? 'すべての記事' : 'All posts'}
          </Link>
        </div>
      ) : null}
      {tag && pageItems.length === 0 ? (
        <p>
          {locale === 'ja'
            ? 'このタグの記事はありません。'
            : 'No posts with this tag.'}
        </p>
      ) : null}

      <BlogPageEditor locale={locale} />

      <div className="flex flex-col gap-y-4">
        {pageItems.map((post) => (
          <div key={post.slug} className="relative">
            <div className="absolute top-3 right-3 z-10 empty:hidden">
              <BlogPageEditor locale={locale} slug={post.slug} compact />
            </div>
            <BlogTile {...post.metadata} slug={post.slug} locale={locale} />
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <Pagination
          className="mt-10"
          // ariaLabel={content.pagination.ariaLabel.value}
        >
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={pageHref(Math.max(currentPage - 1, 1))}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : undefined
                }
                // label={content.pagination.previous.value}
                // ariaLabel={content.pagination.previousAria.value}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={pageHref(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                href={pageHref(Math.min(currentPage + 1, totalPages))}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : undefined
                }
                // label={content.pagination.next.value}
                // ariaLabel={content.pagination.nextAria.value}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  )
}
