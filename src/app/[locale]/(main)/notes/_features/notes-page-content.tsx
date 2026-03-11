import { useIntlayer, useLocale } from 'next-intlayer/server'
import { ExternalLink } from '@/components/site-ui/external-link'
import { PageHeader } from '@/components/site-ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AdminGate } from '@/features/admin/admin-gate'
import { NotesEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/notes-editor-deferred'
import { Content } from '@/components/site-ui/content'
import { EditorAdminTrigger } from '@/features/admin/admin-trigger'

type NotesPageContentProps = {
  notes: {
    body: string
    createdAt: string
    externalUrl?: string
  }[]
}

export async function NotesPageContent({ notes }: NotesPageContentProps) {
  const content = useIntlayer('page-notes')
  const { locale } = useLocale()

  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ja' ? 'ja-JP' : 'en-US',
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

      <AdminGate>
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Notes
            </p>
            <NotesEditorDeferred locale={locale || 'ja'} />
          </div>
          <hr className="mt-12" />
        </Content>
      </AdminGate>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={`${note.createdAt}-${note.body.slice(0, 20)}`}>
            <CardContent className="space-y-3 pt-6">
              <time
                className="text-muted-foreground text-xs"
                dateTime={note.createdAt}
              >
                {dateFormatter.format(new Date(note.createdAt))}
              </time>
              <p className="leading-relaxed whitespace-pre-wrap">{note.body}</p>
              {note.externalUrl ? (
                <ExternalLink href={note.externalUrl}>
                  {content.openExternal.value}
                </ExternalLink>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminGate>
        <EditorAdminTrigger locale={locale || 'ja'} collectionId="notes" />
      </AdminGate>
    </>
  )
}
