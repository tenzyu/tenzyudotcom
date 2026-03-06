import Image from 'next/image'
import { useIntlayer } from 'next-intlayer/server'

import { ExternalLink } from '@/components/site/external-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function AboutMeSection() {
  const content = useIntlayer('portfolio')

  return (
    <Card variant="soft" className="p-0">
      <CardContent className="flex flex-col items-start gap-6 pt-6 md:flex-row">
        <div className="shrink-0">
          <Image
            src="/images/my-icon.png"
            alt={content.about.imageAlt.value}
            width={120}
            height={120}
            className="border-border/60 rounded-2xl border shadow-sm"
            priority
          />
        </div>
        <div className="flex flex-1 flex-col space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {content.about.name}
            </h1>
            <h2 className="text-muted-foreground text-lg">
              {content.about.role}
            </h2>
          </div>
          <p className="text-sm leading-relaxed">{content.about.description}</p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
            {content.about.links.map((link) => (
              <Button
                key={link.url.value}
                variant="ghost"
                className="text-primary h-auto px-0 hover:bg-transparent hover:underline"
                asChild
              >
                <ExternalLink
                  href={link.url.value}
                  aria-label={link.ariaLabel.value}
                >
                  {link.label} &rarr;
                </ExternalLink>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
