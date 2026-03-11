import { useIntlayer } from 'next-intlayer/server'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import { EDITOR_ADMIN_LOCALE } from './editor-admin.constants'
import { NotesEditorClient } from './notes-editor-client'

export function NotesEditor({
  entries,
  expectedVersion,
  locale,
}: {
  entries: NoteSourceEntry[]
  expectedVersion: string
  locale: string
}) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)

  return (
    <NotesEditorClient
      initialEntries={entries}
      expectedVersion={expectedVersion}
      locale={locale}
      labels={{
        add: content.notesEditor.add.value,
        save: content.dashboard.saveLabel.value,
        bodyJa: content.notesEditor.bodyJa.value,
        bodyEn: content.notesEditor.bodyEn.value,
        createdAt: content.notesEditor.createdAt.value,
        externalUrl: content.notesEditor.externalUrl.value,
        published: content.notesEditor.published.value,
        moveUp: content.recommendationsEditor.moveUp.value,
        moveDown: content.recommendationsEditor.moveDown.value,
        remove: content.recommendationsEditor.remove.value,
      }}
    />
  )
}
