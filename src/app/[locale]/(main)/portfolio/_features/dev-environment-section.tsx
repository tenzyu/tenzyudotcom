import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { PORTFOLIO_ENVIRONMENTS } from './portfolio.source'

export function DevEnvironmentSection() {
  const content = useIntlayer('page-portfolio')

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
          <AccordionContent className="space-y-3 pt-3">
            <div className="space-y-4">
              {PORTFOLIO_ENVIRONMENTS.map((environment) => {
                const env = content.environments.items[environment.id]

                return (
                  <Card key={environment.id} variant="soft" className="gap-0">
                    <CardContent className="space-y-2 pt-4 pb-2">
                      <h3 className="text-lg font-semibold">
                        {environment.title}
                      </h3>
                      <p className="text-sm font-medium">{env.subtitle}</p>
                      <p className="text-muted-foreground text-sm leading-6">
                        {env.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 pt-0 pb-4">
                      <Badge variant="secondary">{environment.os}</Badge>
                      <Badge variant="secondary">{environment.role}</Badge>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

            <Card variant="soft" className="gap-0">
              <CardContent className="space-y-3 pt-5 pb-5">
                <h3 className="text-sm font-semibold">
                  {content.environments.networkTitle}
                </h3>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  {content.environments.networkItems.map((item) => (
                    <li key={item.value}>{item}</li>
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
