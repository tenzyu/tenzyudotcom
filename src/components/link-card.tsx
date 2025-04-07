'use client'

import type { MyLink } from '@/data/links'
import Image from 'next/image'
import { Card, CardContent } from './ui/card'

interface LinkCardProps {
  link: MyLink
}

export function LinkCard({ link }: LinkCardProps) {
  const getIcon = (name: string) => {
    const filename = (() => {
      switch (name.toLowerCase()) {
        case 'github':
          return 'github'
        case 'twitter':
          return 'x'
        case 'twitch':
          return 'twitch'
        case 'youtube':
          return 'youtube'
        case 'notion':
          return 'notion'
        case 'discord':
          return 'discord'
        case 'osu!':
          return 'osu'
        case 'reddit':
        case 'reddit (old)':
          return 'reddit'
      }
    })()

    return (
      <Image src={`/icons/${filename}.svg`} width={44} height={44} alt={''} />
    )
  }

  return (
    <a
      href={`/u/${link.shortenUrl}`}
      className='block'
      target='_blank'
      rel='noreferrer'
    >
      <Card className='p-0 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors'>
        <CardContent className='p-4 flex flex-col items-center text-center '>
          <div className='rounded-full p-2 mb-3 dark:bg-[#ddd]'>
            {getIcon(link.name)}
          </div>
          <h3 className='text-lg font-medium dark:text-white mb-1'>
            {link.name}
          </h3>
          <p className='text-gray-400 text-sm'>{link.id}</p>
        </CardContent>
      </Card>
    </a>
  )
}
