import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/shadcn-ui/badge'
import { Card } from '@/components/shadcn-ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn-ui/tooltip'

import type { Platform, Puzzle } from '@/data/puzzles'

const PLATFORM_LABELS: Record<Platform, string> = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
  steam: 'Steam',
  switch: 'Switch',
  other: 'Other',
}

export function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={puzzle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="group hover:bg-accent hover:border-primary/30 flex items-center justify-between gap-4 p-4 shadow-sm transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
              <ExternalLink className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors" />
              <span className="text-card-foreground group-hover:text-primary truncate font-medium transition-colors">
                {puzzle.title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {puzzle.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {PLATFORM_LABELS[platform]}
                </Badge>
              ))}
              <span className="text-muted-foreground ml-1 opacity-0 transition-opacity group-hover:opacity-100">
                &rarr;
              </span>
            </div>
          </Card>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{puzzle.url}</p>
      </TooltipContent>
    </Tooltip>
  )
}
