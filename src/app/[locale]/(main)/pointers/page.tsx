import { getIntlayer } from 'intlayer'
import type { Metadata } from 'next'
import type { LocalPromiseParams, NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import { DASHBOARD_DATA } from '@/data/pointers'
import { ActionLinkTile } from '../(home)/_components/action-link-tile'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('pointersPage', locale)

  return {
    title: content.metadata.title,
    description: content.metadata.description,
  }
}

const PointersPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = useIntlayer('pointersPage', locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
        className="space-y-4"
      />

      <div className="grid gap-12 md:grid-cols-2">
        {DASHBOARD_DATA.map((category) => (
          <section key={category.title} className="space-y-6">
            <SectionHeader
              title={category.title}
              titleClassName="text-lg"
              className="space-y-1"
            />
            <div className="grid gap-4">
              {category.links.map((link) => (
                <ActionLinkTile
                  key={link.name}
                  title={link.name}
                  description={link.description}
                  href={link.url}
                  internal={!!link.isApp}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </IntlayerServerProvider>
  )
}

export default PointersPage
