import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'

export function PhilosophySection() {
  const content = useIntlayer('page-portfolio')

  return (
    <div className="space-y-6">
      <SectionHeader
        title={content.philosophy.sectionTitle.value}
        variant="underline"
      />
      <div className="text-muted-foreground space-y-5 text-sm leading-7">
        {content.philosophy.paragraphs.map((paragraph) => (
          <p key={paragraph.value}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
