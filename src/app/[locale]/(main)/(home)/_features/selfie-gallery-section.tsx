import { Camera, ExternalLink } from 'lucide-react'
import { ExternalLink as SiteExternalLink } from '@/components/site/external-link'
import { Card } from '@/components/ui/card'
import { HOME_SELFIES } from '../_data/selfies'
import { TweetImage } from './tweet-image'

type TimelineSectionProps = {
  title: string
  description: string
}

export function SelfieGallerySection({
  title,
  description,
}: TimelineSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <Camera className="text-primary h-7 w-7" />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <div className="bg-border/50 h-px flex-1" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="columns-2 gap-4 md:columns-3">
        {HOME_SELFIES.map((selfie) => (
          <Card
            key={selfie.id}
            variant="interactive"
            className="group mb-4 break-inside-avoid overflow-hidden border p-0"
            asChild
          >
            <SiteExternalLink
              href={`https://x.com/FlawInAffection/status/${selfie.id}`}
              className="block w-full"
            >
              <TweetImage
                id={selfie.id}
                showLikes
                overlay={
                  <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                }
              />
            </SiteExternalLink>
          </Card>
        ))}
      </div>
    </section>
  )
}
