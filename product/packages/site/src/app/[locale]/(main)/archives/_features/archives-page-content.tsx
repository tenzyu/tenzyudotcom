import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/app/[locale]/_features/content'
import { PageHeader } from '@/app/[locale]/_features/page-header'

export function ArchivesPageContent({ locale }: { locale: string }) {
  const content = useIntlayer('page-archives')

  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <Content size="3xl" className="flex flex-col gap-8">
        <PageHeader
          title={content.metadata.title.value}
          description={content.metadata.description.value}
          className="px-4"
        />

        <section className="grid gap-4">
          <Link
            href={getLocalizedUrl('/archives/osu-profile', locale)}
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">
              {content.cards.osuProfileTitle.value}
            </h2>
            <p className="text-muted-foreground text-sm">
              {content.cards.osuProfileDescription.value}
            </p>
          </Link>
        </section>
      </Content>
    </main>
  )
}
