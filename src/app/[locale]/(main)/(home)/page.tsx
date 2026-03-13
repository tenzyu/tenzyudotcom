import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { loadBlogPosts } from '@/app/[locale]/(main)/blog/_features/blog.assemble'
import { assembleNotesPageData } from '@/app/[locale]/(main)/notes/_features/notes.assemble'
import { HomePageContent } from './_features/home-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-home', {
  pathname: '/',
})

const HomePage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const [notes, posts] = await Promise.all([
    assembleNotesPageData(locale),
    loadBlogPosts(),
  ])

  return (
    <IntlayerServerProvider locale={locale}>
      <HomePageContent
        locale={locale}
        latestNotes={notes.slice(0, 3)}
        latestPost={posts[0]}
      />
    </IntlayerServerProvider>
  )
}

export default HomePage
