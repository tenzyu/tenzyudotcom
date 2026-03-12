import { useIntlayer, useLocale } from 'next-intlayer/server'
import { PageHeader } from '@/app/[locale]/_features/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { NoteAdminMenu } from './note-admin-menu'
import { NoteTweetButton } from './note-tweet-button'

type NotesPageContentProps = {
  notes: {
    body: string
    createdAt: string
  }[]
}

export async function NotesPageContent({ notes }: NotesPageContentProps) {
  const content = useIntlayer('page-notes')
  const { locale } = useLocale()
  const activeLocale = locale || 'ja'
  const dateFormatter = new Intl.DateTimeFormat(
    activeLocale === 'ja' ? 'ja-JP' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  )

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />

      <div className="space-y-4">
        <div className="flex justify-end">
          <AdminGate>
            <NoteTweetButton />
          </AdminGate>
        </div>

        {notes.map((note) => (
          <Card key={`${note.createdAt}-${note.body.slice(0, 20)}`}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-4">
                <time
                  className="text-muted-foreground text-xs"
                  dateTime={note.createdAt}
                >
                  {dateFormatter.format(new Date(note.createdAt))}
                </time>

                <AdminGate>
                  <NoteAdminMenu
                    locale={activeLocale}
                    createdAt={note.createdAt}
                  />
                </AdminGate>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{note.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
