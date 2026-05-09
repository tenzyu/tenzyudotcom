import { useIntlayer } from 'next-intlayer/server'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.domain'
import { EDITOR_ADMIN_LOCALE } from './editor-admin.constants'
import { PointersEditorClient } from './pointers-editor-client'

export function PointersEditor({
  locale,
  entries,
  expectedVersion,
}: {
  locale: string
  entries: DashboardSourceCategory[]
  expectedVersion: string
}) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)

  return (
    <PointersEditorClient
      initialEntries={entries}
      expectedVersion={expectedVersion}
      locale={locale}
      labels={{
        addLink: content.pointersEditor.addLink.value,
        save: content.dashboard.saveLabel.value,
        categoryTitleJa: content.pointersEditor.categoryTitleJa.value,
        categoryTitleEn: content.pointersEditor.categoryTitleEn.value,
        categoryDescriptionJa:
          content.pointersEditor.categoryDescriptionJa.value,
        categoryDescriptionEn:
          content.pointersEditor.categoryDescriptionEn.value,
        linkTitleJa: content.pointersEditor.linkTitleJa.value,
        linkTitleEn: content.pointersEditor.linkTitleEn.value,
        linkDescriptionJa: content.pointersEditor.linkDescriptionJa.value,
        linkDescriptionEn: content.pointersEditor.linkDescriptionEn.value,
        linkId: content.pointersEditor.linkId.value,
        url: content.pointersEditor.url.value,
        isApp: content.pointersEditor.isApp.value,
        moveUp: content.recommendationsEditor.moveUp.value,
        moveDown: content.recommendationsEditor.moveDown.value,
        remove: content.recommendationsEditor.remove.value,
        fetchMetadata: 'Fetch Info',
      }}
    />
  )
}
