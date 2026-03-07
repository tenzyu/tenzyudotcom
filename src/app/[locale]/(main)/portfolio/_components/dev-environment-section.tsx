import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/components/site/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function DevEnvironmentSection() {
  const content = useIntlayer('portfolio')

  return (
    <div className="space-y-8">
      <SectionHeader
        title={content.environments.sectionTitle.value}
        description={content.environments.sectionDescription.value}
        variant="underline"
      />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="environments">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            {content.environments.detailsTrigger}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="space-y-6">
              {content.environments.items.map((env) => (
                <Card key={env.title.value} variant="soft">
                  <CardContent className="space-y-2 pt-6">
                    <h3 className="text-lg font-semibold">{env.title}</h3>
                    <p className="text-sm font-medium">{env.subtitle}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {env.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary">{env.os}</Badge>
                      <Badge variant="secondary">{env.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card variant="soft">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-sm font-semibold">
                  {content.environments.networkTitle}
                </h3>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  {content.environments.networkItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
