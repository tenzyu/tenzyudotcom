import { useIntlayer } from 'next-intlayer/server'
import { PageIntro, ReadingColumn, EditorialList } from '@tenzyu/ui/editorial'
import { ScrapListEditor } from './scrap-page-editor'
import { ScrapCard } from './scrap-card'
import type { ScrapIndexEntry } from '@/features/scraps/scraps.domain'

type ScrapsPageContentProps = {
  locale: string
  scraps: readonly ScrapIndexEntry[]
}

export function ScrapsPageContent({ locale, scraps }: ScrapsPageContentProps) {
  const content = useIntlayer('page-scraps')

  return (
    <ReadingColumn className="space-y-8">
      <PageIntro
        eyebrow="Research logs"
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <ScrapListEditor locale={locale} />
      {scraps.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {content.list.empty.value}
        </p>
      ) : (
        <EditorialList>
          {scraps.map((scrap) => (
            <ScrapCard key={scrap.slug} scrap={scrap} locale={locale} />
          ))}
        </EditorialList>
      )}
    </ReadingColumn>
  )
}
