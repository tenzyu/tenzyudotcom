import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/components/site-ui/section-header'
import { Card, CardContent } from '@/components/ui/card'

export function PhilosophySection() {
  const content = useIntlayer('page-portfolio')

  return (
    <div className="space-y-6">
      <SectionHeader
        title={content.philosophy.sectionTitle.value}
        variant="underline"
      />
      <Card variant="soft">
        <CardContent className="text-muted-foreground space-y-4 pt-6 text-sm leading-relaxed">
          {content.philosophy.paragraphs.map((paragraph) => (
            <p key={paragraph.value}>{paragraph}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
