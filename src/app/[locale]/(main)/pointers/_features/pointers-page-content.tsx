import { useIntlayer } from 'next-intlayer/server'
import { useLocale } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { assembleDashboardContent } from './dashboard/dashboard.assemble'
import { ActionLinkTile } from './dashboard/action-link-tile'
import { AdminGate } from '@/features/admin/admin-gate'
import { PointerAddButton } from './pointer-add-button'
import { PointerAdminMenu } from './pointer-admin-menu'

export async function PointersPageContent() {
  const pageContent = useIntlayer('page-pointers')
  const { locale } = useLocale()
  const dashboardContent = await assembleDashboardContent(locale)

  return (
    <>
      <PageHeader
        title={pageContent.metadata.title.value}
        description={pageContent.lead.value}
        className="flex flex-col gap-4"
      />
      <div className="grid gap-12 md:grid-cols-2">
        {dashboardContent.categories.map((category) => (
          <section key={category.id} className="flex flex-col gap-6">
            <div className="space-y-3">
              <SectionHeader
                title={dashboardContent.categoryContent[category.id].title}
                description={dashboardContent.categoryContent[category.id].description}
                titleClassName="text-lg"
                className="flex flex-col gap-1"
              />
              <AdminGate>
                <div className="flex justify-end">
                  <PointerAddButton locale={locale || 'ja'} categoryId={category.id} />
                </div>
              </AdminGate>
            </div>
            <div className="grid gap-4">
              {category.links.map((link) => (
                <div key={link.id} className="relative">
                  <AdminGate>
                    <div className="absolute top-3 right-3 z-10">
                      <PointerAdminMenu
                        locale={locale || 'ja'}
                        categoryId={category.id}
                        linkId={link.id}
                        label={dashboardContent.links[link.id].title}
                      />
                    </div>
                  </AdminGate>
                  <ActionLinkTile
                    title={dashboardContent.links[link.id].title}
                    description={dashboardContent.links[link.id].description}
                    href={link.url}
                    openInNewTab={!('isApp' in link && !!link.isApp)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
