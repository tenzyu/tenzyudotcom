import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import { DASHBOARD_DATA } from '@/data/pointers'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { ActionLinkTile } from './_features/action-link-tile'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-pointers', {
  pathname: '/pointers',
})

const PointersPageContent = () => {
  const content = useIntlayer('page-pointers')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
        className="flex flex-col gap-4"
      />

      <div className="grid gap-12 md:grid-cols-2">
        {DASHBOARD_DATA.map((category) => (
          <section key={category.title} className="flex flex-col gap-6">
            <SectionHeader
              title={category.title}
              titleClassName="text-lg"
              className="flex flex-col gap-1"
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
    </>
  )
}

const PointersPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <PointersPageContent />
    </IntlayerServerProvider>
  )
}

export default PointersPage
