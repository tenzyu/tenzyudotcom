import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/shadcn-ui/badge'
import { Card } from '@/components/shadcn-ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn-ui/tooltip'

import type { Platform, Puzzle, PuzzleLink } from '@/data/puzzles'

const PLATFORM_LABELS: Record<Platform, string> = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
  steam: 'Steam',
  switch: 'Switch',
  other: 'Other',
}

function PlatformBadge({ link }: { link: PuzzleLink }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <Badge
            variant="secondary"
            className="hover:bg-primary hover:text-primary-foreground cursor-pointer text-xs transition-colors"
          >
            {PLATFORM_LABELS[link.platform]}
          </Badge>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{link.url}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  const primaryUrl = puzzle.url ?? puzzle.links[0]?.url
  const hasMultipleLinks = puzzle.links.length > 1

  const cardContent = (
    <Card className="group hover:bg-accent hover:border-primary/30 flex items-center justify-between gap-4 p-4 shadow-sm transition-all">
      <div className="flex items-center gap-3 overflow-hidden">
        <ExternalLink className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors" />
        <span className="text-card-foreground group-hover:text-primary truncate font-medium transition-colors">
          {puzzle.title}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasMultipleLinks
          ? puzzle.links.map((link) => (
              <PlatformBadge key={link.platform} link={link} />
            ))
          : puzzle.links.map((link) => (
              <Badge
                key={link.platform}
                variant="secondary"
                className="text-xs"
              >
                {PLATFORM_LABELS[link.platform]}
              </Badge>
            ))}
        <span className="text-muted-foreground ml-1 opacity-0 transition-opacity group-hover:opacity-100">
          &rarr;
        </span>
      </div>
    </Card>
  )

  if (hasMultipleLinks) {
    // Multiple links: card title links to primary URL, badges link individually
    return primaryUrl ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {cardContent}
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{primaryUrl}</p>
        </TooltipContent>
      </Tooltip>
    ) : (
      <div className="block">{cardContent}</div>
    )
  }

  // Single link: whole card is clickable
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {cardContent}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{primaryUrl}</p>
      </TooltipContent>
    </Tooltip>
  )
}
