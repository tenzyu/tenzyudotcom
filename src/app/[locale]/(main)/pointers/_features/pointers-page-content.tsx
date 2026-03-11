import { useIntlayer } from 'next-intlayer/server'
import { useLocale } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { ActionLinkTile } from './dashboard/action-link-tile'
import { assembleDashboardContent } from './dashboard/dashboard.assemble'
import { AdminGate } from '@/features/admin/admin-gate'
import { PointersEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/pointers-editor-deferred'
import { Content } from '@/components/site-ui/content'
import { EditorAdminTrigger } from '@/features/admin/admin-trigger'

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

      <AdminGate>
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Pointers
            </p>
            <PointersEditorDeferred locale={locale || 'ja'} />
          </div>
          <hr className="mt-12" />
        </Content>
      </AdminGate>

      <div className="grid gap-12 md:grid-cols-2">
        {dashboardContent.categories.map((category) => (
          <section key={category.id} className="flex flex-col gap-6">
            <SectionHeader
              title={dashboardContent.categoryContent[category.id].title}
              description={dashboardContent.categoryContent[category.id].description}
              titleClassName="text-lg"
              className="flex flex-col gap-1"
            />
            <div className="grid gap-4">
              {category.links.map((link) => (
                <ActionLinkTile
                  key={link.id}
                  title={dashboardContent.links[link.id].title}
                  description={dashboardContent.links[link.id].description}
                  href={link.url}
                  openInNewTab={!('isApp' in link && !!link.isApp)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <AdminGate>
        <EditorAdminTrigger locale={locale || 'ja'} collectionId="pointers" />
      </AdminGate>
    </>
  )
}
