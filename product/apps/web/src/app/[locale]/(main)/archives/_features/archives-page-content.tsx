import { getLocalizedUrl } from 'intlayer'
import { FolderArchive } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@tenzyu/ui/content'
import { PageHeader } from '@tenzyu/ui/page-header'
import { Card, CardContent } from '@tenzyu/ui/card'

export function ArchivesPageContent({ locale }: { locale: string }) {
  const content = useIntlayer('page-archives')

  return (
    <main className="px-4 py-8 md:py-12">
      <Content size="2xl" className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Archives"
          title={content.metadata.title.value}
          description={content.metadata.description.value}
        />

        <section className="grid gap-4">
          <Card asChild variant="interactive" className="gap-0 py-0">
            <Link href={getLocalizedUrl('/archives/osu-profile', locale)}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="border-primary/20 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border">
                  <FolderArchive className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {content.cards.osuProfileTitle.value}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-6">
                    {content.cards.osuProfileDescription.value}
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </section>
      </Content>
    </main>
  )
}
