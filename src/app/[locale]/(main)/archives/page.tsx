import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'

import { Content } from '@/components/site/content'
import { PageHeader } from '@/components/site/page-header'
import {
  createPageMetadata,
  resolvePageLocale,
} from '@/lib/intlayer/page'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('archivesPage', {
  pathname: '/archives',
})

const ArchivesPageContent = ({ locale }: { locale: string }) => {
  const content = useIntlayer('archivesPage')

  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <Content size="3xl" className="flex flex-col gap-8">
        <PageHeader
          title={content.metadata.title.value}
          description={content.metadata.description.value}
          className="px-4"
        />

        <section className="grid gap-4">
          <Link
            href={getLocalizedUrl('/archives/osu-profile', locale)}
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">
              {content.cards.osuProfileTitle.value}
            </h2>
            <p className="text-muted-foreground text-sm">
              {content.cards.osuProfileDescription.value}
            </p>
          </Link>
        </section>
      </Content>
    </main>
  )
}

const ArchivesPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <ArchivesPageContent locale={locale} />
    </IntlayerServerProvider>
  )
}

export default ArchivesPage
