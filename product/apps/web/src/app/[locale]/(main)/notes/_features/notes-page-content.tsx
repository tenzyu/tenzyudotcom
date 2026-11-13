import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { EditorialEntry, EditorialList } from '@tenzyu/ui/editorial'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { NoteComposerInline } from './note-composer-inline'
import { NoteFeedItem } from './note-feed-item'

type NotesPageContentProps = {
  locale: string
  notes: {
    id: string
    body: string
    createdAt: string
    depth: number
    externalUrl?: string
    parentId?: string
    hasConnectorAbove: boolean
    hasConnectorBelow: boolean
    sharePath: string
    showBottomBorder: boolean
  }[]
}

export async function NotesPageContent({
  locale,
  notes,
}: NotesPageContentProps) {
  const content = useIntlayer('page-notes', locale)

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
      />

      <div className="space-y-5">
        <AdminGate>
          <NoteComposerInline />
        </AdminGate>

        <EditorialList>
          {notes.map((note) => (
            <EditorialEntry key={note.id} className="py-0 [&>article]:border-b-0">
              <NoteFeedItem
                locale={locale}
                note={note}
                authorName="tenzyu"
                authorHandle="@tenzyu.com"
              />
            </EditorialEntry>
          ))}
        </EditorialList>
      </div>
    </>
  )
}
