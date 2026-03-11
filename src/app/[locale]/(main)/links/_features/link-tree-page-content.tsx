import { useIntlayer, useLocale } from 'next-intlayer/server'
import { LinksEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/links-editor-deferred'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import { AdminGate } from '@/features/admin/admin-gate'
import { LinkList } from '@/features/links/link-list'

export async function LinkTreePageContent() {
  const content = useIntlayer('page-links')
  const { locale } = useLocale()

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <AdminGate>
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Links
            </p>
            <LinksEditorDeferred locale={locale || 'ja'} />
          </div>
          <hr className="my-8" />
        </Content>
      </AdminGate>
      <LinkList />
    </>
  )
}
