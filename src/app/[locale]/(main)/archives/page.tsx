import Link from 'next/link'
import { getLocalizedUrl } from 'intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { getIntlayer, LocalPromiseParams, NextPageIntlayer } from 'next-intlayer'
import { Metadata } from 'next'

import { Content } from '@/components/site/content'
import { PageHeader } from '@/components/site/page-header'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('archivesPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

const ArchivesPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = getIntlayer('archivesPage', locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <main className="flex flex-col items-center p-4 py-8 md:py-12">
        <Content size="3xl" className="space-y-8">
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
                {content.cards.osuProfileTitle}
              </h2>
              <p className="text-muted-foreground text-sm">
                {content.cards.osuProfileDescription}
              </p>
            </Link>
          </section>
        </Content>
      </main>
    </IntlayerServerProvider>
  )
}

export default ArchivesPage
