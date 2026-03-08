import { useIntlayer } from 'next-intlayer/server'
import type { MyLink } from '@/features/links/links.contract'
import { EDITORIAL_ADMIN_LOCALE } from './constants'
import { LinksEditorClient } from './links-editor-client'

export function LinksEditor({
  locale,
  entries,
  expectedVersion,
}: {
  locale: string
  entries: MyLink[]
  expectedVersion: string
}) {
  const content = useIntlayer('editorialAdmin', EDITORIAL_ADMIN_LOCALE)

  return (
    <LinksEditorClient
      initialEntries={entries}
      expectedVersion={expectedVersion}
      locale={locale}
      labels={{
        add: content.linksEditor.add.value,
        save: content.dashboard.saveLabel.value,
        name: content.linksEditor.name.value,
        id: content.linksEditor.id.value,
        url: content.linksEditor.url.value,
        shortenUrl: content.linksEditor.shortenUrl.value,
        icon: content.linksEditor.icon.value,
        category: content.linksEditor.category.value,
        moveUp: content.recommendationsEditor.moveUp.value,
        moveDown: content.recommendationsEditor.moveDown.value,
        remove: content.recommendationsEditor.remove.value,
      }}
    />
  )
}
