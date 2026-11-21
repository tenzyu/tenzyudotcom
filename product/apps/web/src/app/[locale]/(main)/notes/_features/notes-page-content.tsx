import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { EditorialEntry, EditorialList } from '@tenzyu/ui/editorial'
import { NoteControls } from './note-controls'
import { NoteFeedItem } from './note-feed-item'
import type { NotePageItem } from './notes.assemble'

export async function NotesPageContent({
  locale,
  notes,
}: {
  locale: string
  notes: NotePageItem[]
}) {
  const content = useIntlayer('page-notes', locale)
  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
      />
      <div className="space-y-5">
        <NoteControls locale={locale} />
        <EditorialList>
          {notes.map((note) => (
            <EditorialEntry
              key={note.id}
              className="py-0 [&>article]:border-b-0"
            >
              <NoteFeedItem locale={locale} note={note} />
            </EditorialEntry>
          ))}
        </EditorialList>
      </div>
    </>
  )
}
