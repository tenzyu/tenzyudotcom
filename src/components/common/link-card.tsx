'use client'

import { Card, CardContent } from '@/components/shadcn-ui/card'
import type { MyLink } from '@/data/links'
import Image from 'next/image'
import { memo } from 'react'

interface LinkCardProps {
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
      loading='lazy'
      quality={75}
    />
  )
})

export const LinkCard = memo(function LinkCard({ link }: LinkCardProps) {
  return (
    <a
      href={`/u/${link.shortenUrl}`}
      className='block focus:outline-none focus:ring-2 focus:ring-primary'
      target='_blank'
      rel='noreferrer'
      aria-label={`Visit ${link.name} profile - ${link.id}`}
    >
      <Card className='p-0 hover:bg-gray-100 dark:hover:bg-zinc-950 transition-colors'>
        <CardContent className='p-4 flex flex-col items-center text-center'>
          <div
            className='rounded-full p-2 mb-3 dark:bg-[#ddd]'
            aria-hidden='true'
          >
            <LinkIcon name={link.name} />
          </div>
          <h3 className='text-lg font-medium dark:text-white mb-1'>
            {link.name}
          </h3>
          <p className='text-gray-400 text-sm'>{link.id}</p>
        </CardContent>
      </Card>
    </a>
  )
})
