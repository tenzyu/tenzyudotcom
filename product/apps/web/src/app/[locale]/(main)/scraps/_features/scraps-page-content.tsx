import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { ScrapCard } from './scrap-card'
import type { ScrapIndexEntry } from './scraps.domain'

type ScrapsPageContentProps = {
  locale: string
  scraps: readonly ScrapIndexEntry[]
}

export function ScrapsPageContent({ locale, scraps }: ScrapsPageContentProps) {
  const content = useIntlayer('page-scraps')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      {scraps.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {content.list.empty.value}
        </p>
      ) : (
        <div className="flex flex-col gap-y-4">
          {scraps.map((scrap) => (
            <ScrapCard key={scrap.slug} scrap={scrap} locale={locale} />
          ))}
        </div>
      )}
    </>
  )
}
