import type { NextPageIntlayer } from 'next-intlayer'
import { connection } from 'next/server'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { assembleNotesPageData } from '@/features/notes/notes.assemble'
import { NotesPageContent } from '@/features/notes/notes-page-content'
import { loadPublication } from '@/lib/content-store/publication.assemble'

export const generateMetadata = createPageMetadata('page-notes', {
  pathname: '/notes',
})

const NotesPage: NextPageIntlayer = async ({ params }) => {
  await connection()
  const locale = await resolvePageLocale(params)
  const notes = await assembleNotesPageData(await loadPublication(), locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <NotesPageContent locale={locale} notes={notes} />
    </IntlayerServerProvider>
  )
}

export default NotesPage
