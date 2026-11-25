import type { NextPageIntlayer } from 'next-intlayer'
import { connection } from 'next/server'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { loadBlogPosts } from '@/app/[locale]/(main)/blog/_features/blog.assemble'
import { assembleNotesPageData } from '@/features/notes/notes.assemble'
import { HomePageContent } from './_features/home-page-content'
import { loadPublication } from '@/lib/content-store/publication.assemble'

export const generateMetadata = createPageMetadata('page-home', {
  pathname: '/',
})

const HomePage: NextPageIntlayer = async ({ params }) => {
  await connection()
  const locale = await resolvePageLocale(params)
  const fragments = await loadPublication()
    .then((snapshot) =>
      Promise.all([
        assembleNotesPageData(snapshot, locale),
        loadBlogPosts(snapshot),
      ]),
    )
    .catch(() => null)

  return (
    <IntlayerServerProvider locale={locale}>
      <HomePageContent
        locale={locale}
        latestNotes={fragments?.[0].slice(0, 3) ?? []}
        latestPost={fragments?.[1][0]}
        fragmentsUnavailable={fragments === null}
      />
    </IntlayerServerProvider>
  )
}

export default HomePage
