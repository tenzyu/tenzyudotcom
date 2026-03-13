import Image from 'next/image'
import { useIntlayer } from 'next-intlayer/server'

import { ExternalLink } from '@/app/[locale]/_features/external-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PORTFOLIO_ABOUT_LINKS,
  PORTFOLIO_PROFILE_IMAGE_PATH,
} from './portfolio.source'

export function AboutMeSection() {
  const content = useIntlayer('page-portfolio')

  return (
    <Card variant="soft" className="p-0">
      <CardContent className="flex flex-col items-start gap-5 py-6 md:flex-row md:items-center">
        <div className="shrink-0">
          <Image
            src={PORTFOLIO_PROFILE_IMAGE_PATH}
            alt={content.about.imageAlt.value}
            width={112}
            height={112}
            className="border-border/60 rounded-2xl border shadow-sm"
            priority
          />
        </div>
        <div className="flex flex-1 flex-col space-y-2.5">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {content.about.name}
            </h1>
            <h2 className="text-muted-foreground text-lg">
              {content.about.role}
            </h2>
          </div>
          <p className="text-sm leading-7">{content.about.description}</p>
          <div className="flex flex-wrap gap-4 pt-1 text-sm font-medium">
            {PORTFOLIO_ABOUT_LINKS.map((link) => {
              const linkContent = content.about.links[link.id]

              return (
                <Button
                  key={link.id}
                  variant="ghost"
                  className="text-primary h-auto px-0 hover:bg-transparent hover:underline"
                  asChild
                >
                  <ExternalLink
                    href={link.url}
                    aria-label={linkContent.ariaLabel.value}
                  >
                    {linkContent.label} &rarr;
                  </ExternalLink>
                </Button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
