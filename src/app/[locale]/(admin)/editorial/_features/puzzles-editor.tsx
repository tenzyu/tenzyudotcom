import { useIntlayer } from 'next-intlayer/server'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.source'
import { EDITORIAL_ADMIN_LOCALE } from './constants'
import { PuzzlesEditorClient } from './puzzles-editor-client'

export function PuzzlesEditor({
  locale,
  entries,
  expectedVersion,
}: {
  locale: string
  entries: PuzzleCategory[]
  expectedVersion: string
}) {
  const content = useIntlayer('editorialAdmin', EDITORIAL_ADMIN_LOCALE)

  return (
    <PuzzlesEditorClient
      initialEntries={entries}
      expectedVersion={expectedVersion}
      locale={locale}
      labels={{
        addPuzzle: content.puzzlesEditor.addPuzzle.value,
        addLink: content.puzzlesEditor.addLink.value,
        save: content.dashboard.saveLabel.value,
        title: content.puzzlesEditor.title.value,
        primaryUrl: content.puzzlesEditor.primaryUrl.value,
        linkUrl: content.puzzlesEditor.linkUrl.value,
        platform: content.puzzlesEditor.platform.value,
        moveUp: content.recommendationsEditor.moveUp.value,
        moveDown: content.recommendationsEditor.moveDown.value,
        remove: content.recommendationsEditor.remove.value,
      }}
    />
  )
}
