import { getLocalizedUrl } from 'intlayer'
import { useIntlayer } from 'next-intlayer/server'
import Link from 'next/link'
import { PageHeader } from '@/components/site-ui/page-header'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { BlogTile } from './blog-tile'
import type { BlogListItem } from './blog.assemble'
import { AdminGate } from '@/features/admin/admin-gate'
import { Content } from '@/components/site-ui/content'
import { Button } from '@/components/ui/button'

type BlogPageContentProps = {
  currentPage: number
  locale: string
  pageItems: BlogListItem[]
  totalPages: number
}

export async function BlogPageContent({
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

      <AdminGate>
        <Content size="4xl" className="mb-8">
          <div className="border-border/70 bg-muted/30 flex flex-col gap-4 rounded-2xl border px-4 py-4 sm:px-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-wide">
                Blog admin tools
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Create a new post or jump into a single post editor from the
                list without expanding the full editor on this page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={getLocalizedUrl('/editor/blog', locale)}>
                Open blog editor
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={getLocalizedUrl('/editor/blog?create=1', locale)}>
                Create post
              </Link>
            </Button>
            </div>
          </div>
        </Content>
      </AdminGate>

      <div className="flex flex-col gap-y-4">
        {pageItems.map((post) => (
          <div key={post.slug} className="space-y-2">
            <AdminGate>
              <div className="flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={getLocalizedUrl(
                      `/editor/blog?slug=${post.slug}`,
                      locale,
                    )}
                  >
                    Edit {post.slug}
                  </Link>
                </Button>
              </div>
            </AdminGate>
            <BlogTile {...post.metadata} slug={post.slug} locale={locale} />
          </div>
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
