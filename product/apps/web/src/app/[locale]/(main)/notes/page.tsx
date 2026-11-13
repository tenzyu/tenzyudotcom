import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { assembleNotesPageData } from './_features/notes.assemble'
import { NotesPageContent } from './_features/notes-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-notes', {
  pathname: '/notes',
})

const NotesPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const notes = await assembleNotesPageData(locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <NotesPageContent locale={locale} notes={notes} />
    </IntlayerServerProvider>
  )
}

export default NotesPage
