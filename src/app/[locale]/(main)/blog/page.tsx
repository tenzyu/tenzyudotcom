import type { LocalPromiseParams } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { BlogPageContent } from './_features/blog-page-content'
import { assemblePaginatedBlogPosts } from './_features/blog.assemble'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-blog', {
  pathname: '/blog',
})

type PageProps = LocalPromiseParams & {
  searchParams?: {
    page?: string
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const locale = await resolvePageLocale(params)
  const { currentPage, pageItems, totalPages } = await assemblePaginatedBlogPosts(
    searchParams?.page,
  )

  return (
    <IntlayerServerProvider locale={locale}>
      <BlogPageContent
        currentPage={currentPage}
        locale={locale}
        pageItems={pageItems}
        totalPages={totalPages}
      />
    </IntlayerServerProvider>
  )
}
