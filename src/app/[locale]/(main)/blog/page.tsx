import { getLocalizedUrl } from 'intlayer'
import type { LocalPromiseParams } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'
import {
  createPageMetadata,
  resolvePageLocale,
} from '@/lib/intlayer/page'
import { BlogTile } from './_components/blog-tile'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('blogPage', {
  pathname: '/blog',
})

const PAGE_SIZE = 6

type PageProps = LocalPromiseParams & {
  searchParams?: {
    page?: string
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const locale = await resolvePageLocale(params)

  const awaited_posts = await getBlogPosts()
  const totalPages = Math.ceil(awaited_posts.length / PAGE_SIZE)
  const pageParam = Number(searchParams?.page ?? 1)
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(Math.max(pageParam, 1), Math.max(totalPages, 1))
    : 1
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageItems =
    totalPages > 0
      ? awaited_posts.slice(startIndex, startIndex + PAGE_SIZE)
      : []

  const pageHref = (page: number) => {
    const href = page === 1 ? '/blog' : `/blog?page=${page}`
    return getLocalizedUrl(href, locale)
  }

  return (
    <IntlayerServerProvider locale={locale}>
      <BlogPageContent
        currentPage={currentPage}
        locale={locale}
        pageHref={pageHref}
        pageItems={pageItems}
        totalPages={totalPages}
      />
    </IntlayerServerProvider>
  )
}

function BlogPageContent({
  currentPage,
  locale,
  pageHref,
  pageItems,
  totalPages,
}: {
  currentPage: number
  locale: string
  pageHref: (page: number) => string
  pageItems: Awaited<ReturnType<typeof getBlogPosts>>
  totalPages: number
}) {
  const content = useIntlayer('blogPage')

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
        <Pagination className="mt-10" ariaLabel={content.pagination.ariaLabel.value}>
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
