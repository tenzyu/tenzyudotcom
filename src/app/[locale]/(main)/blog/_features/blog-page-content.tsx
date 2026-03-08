import { getLocalizedUrl } from 'intlayer'
import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { BlogListItem } from '../_lib/get-paginated-blog-posts'
import { BlogTile } from './blog-tile'

type BlogPageContentProps = {
  currentPage: number
  locale: string
  pageItems: BlogListItem[]
  totalPages: number
}

export function BlogPageContent({
  currentPage,
  locale,
  pageItems,
  totalPages,
}: BlogPageContentProps) {
  const content = useIntlayer('page-blog')

  const pageHref = (page: number) => {
    const href = page === 1 ? '/blog' : `/blog?page=${page}`
    return getLocalizedUrl(href, locale)
  }

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <div className="flex flex-col gap-y-4">
        {pageItems.map((post) => (
          <BlogTile
            key={post.slug}
            {...post.metadata}
            slug={post.slug}
            locale={locale}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <Pagination
          className="mt-10"
          ariaLabel={content.pagination.ariaLabel.value}
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
                label={content.pagination.previous.value}
                ariaLabel={content.pagination.previousAria.value}
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
                label={content.pagination.next.value}
                ariaLabel={content.pagination.nextAria.value}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  )
}
