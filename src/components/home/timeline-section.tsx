import { ExternalLink } from 'lucide-react'

import { Card } from '@/components/shadcn-ui/card'
import { HOME_SELFIES } from '@/data/home'

import { TweetImage } from '../social/tweet-image'

type TimelineSectionProps = {
  title: string
  description: string
}

export function TimelineSection({ title, description }: TimelineSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <div className="bg-border/50 h-px flex-1"></div>
      </div>
      <p className="text-muted-foreground text-sm font-medium">{description}</p>

      <div className="columns-2 gap-4 md:columns-3">
        {HOME_SELFIES.map((selfie) => (
          <Card
            key={selfie.id}
            className="group border-border/40 hover:border-primary/50 mb-4 break-inside-avoid overflow-hidden p-0 transition-all hover:scale-105 hover:shadow-md"
          >
            <a
              href={`https://x.com/FlawInAffection/status/${selfie.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full"
            >
              <TweetImage id={selfie.id} />
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
              </div>
            </a>
          </Card>
        ))}
      </div>
    </section>
  )
}
