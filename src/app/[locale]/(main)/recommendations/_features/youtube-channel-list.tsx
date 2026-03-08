import { ArrowUpRight, Youtube } from 'lucide-react'
import { ExternalLink } from '@/components/site/external-link'
import { OtakuAside } from '@/components/site/otaku-aside'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { YouTubeChannelItem } from './lib/types'

type YouTubeChannelListProps = {
  channels: YouTubeChannelItem[]
  commentLabel?: string
  openLabel?: string
  className?: string
}

export function YouTubeChannelList({
  channels,
  commentLabel = 'Quick comment',
  openLabel = 'Open channel',
  className,
}: YouTubeChannelListProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-card/40 rounded-2xl border',
        className,
      )}
    >
      <ul className="divide-border/60 divide-y">
        {channels.map((channel) => (
          <li
            key={channel.url}
            className="flex flex-col gap-4 px-4 py-5 sm:px-5"
          >
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
                <Youtube className="size-3.5 text-red-500" />
                <span>YouTube Channel</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg leading-snug font-semibold">
                  {channel.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {channel.handle}
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full">
              <ExternalLink
                href={channel.url}
                aria-label={openLabel}
                className="justify-center"
              >
                <span>{openLabel}</span>
                <ArrowUpRight data-icon="inline-end" />
              </ExternalLink>
            </Button>

            <OtakuAside label={commentLabel}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {channel.note}
              </p>
            </OtakuAside>
          </li>
        ))}
      </ul>
    </div>
  )
}
