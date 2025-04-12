'use client'

import Image from 'next/image'
import { memo } from 'react'

import { Card, CardContent } from '@/components/shadcn-ui/card'
import type { MyLink } from '@/data/links'

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
    <a
      href={`/u/${link.shortenUrl}`}
      className="focus:ring-primary block focus:ring-2 focus:outline-none"
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${link.name} profile - ${link.id}`}
    >
      <Card className="p-0 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-950">
        <CardContent className="flex flex-col items-center p-4 text-center">
          <div
            className="mb-3 rounded-full p-2 dark:bg-[#ddd]"
            aria-hidden="true"
          >
            <LinkIcon name={link.name} />
          </div>
          <h3 className="mb-1 text-lg font-medium dark:text-white">
            {link.name}
          </h3>
          <p className="text-sm text-gray-400">{link.id}</p>
        </CardContent>
      </Card>
    </a>
  )
})
