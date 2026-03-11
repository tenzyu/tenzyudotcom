import { getLocalizedUrl } from 'intlayer'
import { useIntlayer } from 'next-intlayer/server'
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
import { AdminGate } from '@/app/[locale]/(admin)/editor/_features/admin-gate'
import { BlogEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/blog-editor-deferred'
import { Content } from '@/components/site-ui/content'
import { EditorAdminTrigger } from '@/app/[locale]/(admin)/editor/_features/admin-trigger'

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
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Blog
            </p>
            <BlogEditorDeferred locale={locale} />
          </div>
          <hr className="mt-12" />
        </Content>
      </AdminGate>

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

      <AdminGate>
        <EditorAdminTrigger locale={locale} collectionId="blog" />
      </AdminGate>

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
