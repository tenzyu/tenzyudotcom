'use client'

import type { MyLink } from '@/data/links'
import Image from 'next/image'
import Link from 'next/link'

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
    <Link
      href={`/u/${link.shortenUrl}`}
      className='block'
      target='_blank'
      rel='noreferrer'
    >
      <div className='border rounded-lg p-4 flex flex-col items-center text-center hover:bg-gray-900 transition-colors'>
        <div className='rounded-full p-2 mb-3 dark:bg-[#ccc]'>
          {getIcon(link.name)}
        </div>
        <h3 className='text-lg font-medium dark:text-white mb-1'>
          {link.name}
        </h3>
        <p className='text-gray-400 text-sm'>{link.id}</p>
      </div>
    </Link>
  )
}
