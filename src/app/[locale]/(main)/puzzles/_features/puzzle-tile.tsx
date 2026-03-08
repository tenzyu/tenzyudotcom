import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/components/site-ui/external-link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PuzzleWithOgp } from './lib/types'
import type { Platform, PuzzleLink } from './puzzles.data'

const PLATFORM_ICONS: Record<Platform, string> = {
  web: '🌐',
  ios: '🍎',
  android: '▶️',
  steam: '🎮',
  switch: '🕹️',
  other: '🔗',
}

function PlatformButton({ link }: { link: PuzzleLink }) {
  const content = useIntlayer('page-puzzles')
  const label = content.platforms[link.platform]
  const icon = PLATFORM_ICONS[link.platform]

  return (
    <Button variant="soft" size="sm" className="group/btn gap-2" asChild>
      <ExternalLink href={link.url} aria-label={label.value}>
        <span className="text-base leading-none" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
        <ExternalLinkIcon
          className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover/btn:opacity-100"
          aria-hidden="true"
        />
      </ExternalLink>
    </Button>
  )
}

export function PuzzleTile({ puzzle }: { puzzle: PuzzleWithOgp }) {
  const puzzlesContent = useIntlayer('page-puzzles')
  const ogpDescription = puzzle.ogp.description
  const ogpImage = puzzle.ogp.image
  const isSingleWebLink =
    puzzle.links.length === 1 && puzzle.links[0]?.platform === 'web'
  const primaryLink = puzzle.links[0]
  const webLabel = puzzlesContent.platforms.web

  const cardContent = (
    <div className="flex flex-col sm:flex-row">
      {/* OGP Image / Fallback */}
      <div className="bg-muted relative aspect-2/1 w-full shrink-0 sm:aspect-4/3 sm:w-44">
        {ogpImage ? (
          <Image
            src={ogpImage}
            alt={`${puzzle.title}${puzzlesContent.aria.thumbnailSuffix.value}`}
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

        <CardContent>
          {isSingleWebLink ? (
            <div className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium">
              <span className="text-base leading-none" aria-hidden="true">
                {PLATFORM_ICONS.web}
              </span>
              <span>{webLabel}</span>
              <ExternalLinkIcon className="h-3.5 w-3.5 opacity-40" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {puzzle.links.map((link) => (
                <PlatformButton key={link.platform} link={link} />
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )

  if (isSingleWebLink && primaryLink) {
    return (
      <Card variant="interactive" className="overflow-hidden p-0" asChild>
        <ExternalLink
          href={primaryLink.url}
          aria-label={webLabel.value}
          className="block"
        >
          {cardContent}
        </ExternalLink>
      </Card>
    )
  }

  return (
    <Card variant="interactive" className="overflow-hidden p-0">
      {cardContent}
    </Card>
  )
}
