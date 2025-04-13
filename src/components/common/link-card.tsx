'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'

import { Card, CardContent } from '@/components/shadcn-ui/card'
import type { MyLink } from '@/data/links'
import { cn } from '@/lib/utils'

type LinkCardProps = {
  link: MyLink
}

const ICON_MAPPING = {
  github: 'github',
  twitter: 'x',
  twitch: 'twitch',
  youtube: 'youtube',
  notion: 'notion',
  discord: 'discord',
  'osu!': 'osu',
  reddit: 'reddit',
  'reddit (old)': 'reddit',
} as const

const LinkIcon = memo(function LinkIcon({ name }: { name: string }) {
  const filename =
    ICON_MAPPING[name.toLowerCase() as keyof typeof ICON_MAPPING] ||
    name.toLowerCase()

  return (
    <Image
      src={`/icons/${filename}.svg`}
      width={44}
      height={44}
      alt={`${name} icon`}
      priority={false}
      loading="lazy"
      quality={75}
    />
  )
})

export const LinkCard = memo(function LinkCard({ link }: LinkCardProps) {
  return (
    <Link
      href={`/u/${link.shortenUrl}`}
      className="focus:ring-primary block focus:ring-2 focus:outline-none rounded-lg"
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${link.name} profile - ${link.id}`}
    >
      <Card className="p-0 transition-colors hover:bg-accent dark:hover:bg-accent">
        <CardContent className="flex flex-col items-center p-4 text-center">
          <div
            className={cn(
              'mb-3 rounded-full p-2',
              'dark:bg-secondary-foreground',
            )}
            aria-hidden="true"
          >
            <LinkIcon name={link.name} />
          </div>
          <h3 className="mb-1 text-lg font-medium text-card-foreground">
            {link.name}
          </h3>
          <p className="text-sm text-muted-foreground">{link.id}</p>
        </CardContent>
      </Card>
    </Link>
  )
})
