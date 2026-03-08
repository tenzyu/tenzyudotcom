import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { ActionLinkTile } from './dashboard/action-link-tile'
import { DASHBOARD_DATA } from './dashboard/dashboard.data'

export function PointersPageContent() {
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
          <section key={category.id} className="flex flex-col gap-6">
            <SectionHeader
              title={content.dashboard.categories[category.id].title.value}
              description={
                content.dashboard.categories[category.id].description.value
              }
              titleClassName="text-lg"
              className="flex flex-col gap-1"
            />
            <div className="grid gap-4">
              {category.links.map((link) => (
                <ActionLinkTile
                  key={link.id}
                  title={content.dashboard.links[link.id].title.value}
                  description={content.dashboard.links[link.id].description.value}
                  href={link.url}
                  internal={'isApp' in link && !!link.isApp}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
