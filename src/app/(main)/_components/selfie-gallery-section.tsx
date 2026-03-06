import { ExternalLink } from 'lucide-react'

import { ExternalLink as SiteExternalLink } from '@/components/site/external-link'
import { SectionHeader } from '@/components/site/section-header'
import { Card } from '@/components/ui/card'
import { TweetImage } from '@/components/features/social/tweet-image'
import { HOME_SELFIES } from '@/data/home'

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
      <SectionHeader title={title} description={description} />

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
              className="relative block w-full"
            >
              <TweetImage id={selfie.id} />
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
              </div>
            </SiteExternalLink>
          </Card>
        ))}
      </div>
    </section>
  )
}
