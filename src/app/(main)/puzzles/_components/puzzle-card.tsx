import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { Platform, PuzzleLink } from '@/data/puzzles'
import type { OgpData } from '@/lib/ogp'

const PLATFORM_CONFIG: Record<Platform, { ctaLabel: string; icon: string }> = {
  web: { ctaLabel: 'ウェブで遊ぶ', icon: '🌐' },
  ios: { ctaLabel: 'App Store で入手', icon: '🍎' },
  android: { ctaLabel: 'Google Play で入手', icon: '▶️' },
  steam: { ctaLabel: 'Steam で入手', icon: '🎮' },
  switch: { ctaLabel: 'Nintendo eShop で入手', icon: '🕹️' },
  other: { ctaLabel: 'リンクを開く', icon: '🔗' },
}

function PlatformButton({ link }: { link: PuzzleLink }) {
  const config = PLATFORM_CONFIG[link.platform]

  return (
    <Button variant="action" size="sm" className="group/btn gap-2" asChild>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={config.ctaLabel}
      >
        <span className="text-base leading-none" aria-hidden="true">
          {config.icon}
        </span>
        <span>{config.ctaLabel}</span>
        <ExternalLinkIcon
          className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover/btn:opacity-100"
          aria-hidden="true"
        />
      </a>
    </Button>
  )
}

export type PuzzleWithOgp = {
  title: string
  url?: string
  links: PuzzleLink[]
  ogp: OgpData
}

export function PuzzleCard({ puzzle }: { puzzle: PuzzleWithOgp }) {
  const ogpDescription = puzzle.ogp.description
  const ogpImage = puzzle.ogp.image

  return (
    <Card variant="interactive" className="overflow-hidden p-0">
      <div className="flex flex-col sm:flex-row">
        {/* OGP Image / Fallback */}
        <div className="bg-muted relative aspect-2/1 w-full shrink-0 sm:aspect-4/3 sm:w-44">
          {ogpImage ? (
            <Image
              src={ogpImage}
              alt={`${puzzle.title} のサムネイル`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span
                className="text-muted-foreground/60 text-5xl"
                aria-hidden="true"
              >
                🧩
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-2">
          <CardHeader className="gap-1">
            <CardTitle className="text-lg leading-snug text-balance">
              {puzzle.title}
            </CardTitle>
            {ogpDescription ? (
              <CardDescription className="line-clamp-2 text-pretty">
                {ogpDescription}
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardContent className="">
            <div className="flex flex-wrap gap-2">
              {puzzle.links.map((link) => (
                <PlatformButton key={link.platform} link={link} />
              ))}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
