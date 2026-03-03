import { ExternalLink } from 'lucide-react'
import Image from 'next/image'

import { Card } from '@/components/shadcn-ui/card'
import { HOME_SELFIES } from '@/data/home'

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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {HOME_SELFIES.map((selfie) => (
          <Card
            key={selfie.id}
            className="group border-border/40 hover:border-primary/50 h-full overflow-hidden transition-all hover:shadow-md"
          >
            <a
              href={`https://x.com/FlawInAffection/status/${selfie.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block aspect-[4/5] w-full"
            >
              <Image
                src={selfie.imageUrl}
                alt="Selfie"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
              </div>
            </a>
          </Card>
        ))}
      </div>
    </section>
  )
}
