import { BlogTile } from './_components/blog-tile'
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

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'osu! の記録、ツールやWeb技術、日常の気付きなどを書き残します。',
}

const PAGE_SIZE = 6

type PageProps = {
  searchParams?: {
    page?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
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

  const pageHref = (page: number) =>
    page === 1 ? '/blog' : `/blog?page=${page}`

  return (
    <>
      <PageHeader
        title="Blog"
        description="osu! の記録、ツールやWeb技術、日常の気付きなどを書き残します。"
      />
      <div className="flex flex-col gap-y-4">
        {pageItems.map((post) => (
          <BlogTile key={post.slug} {...post.metadata} slug={post.slug} />
        ))}
      </div>

      {totalPages > 1 ? (
        <Pagination className="mt-10">
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
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  )
}
