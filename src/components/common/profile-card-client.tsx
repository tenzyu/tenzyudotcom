'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'

export const ProfileHeader = () => {
  const [isGifLoading, setIsGifLoading] = useState(true)
  const t = useTranslations()

  return (
    <div
      className='aspect-[16/9] relative overflow-hidden bg-muted'
      aria-label={t('profile.loading.gameplay')}
    >
      {isGifLoading && (
        <div className='absolute inset-0 flex items-center justify-center z-10 bg-muted'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2
              className='h-8 w-8 animate-spin text-primary'
              aria-hidden='true'
            />
            <span className='text-sm text-muted-foreground'>
              {t('profile.loading.gameplay')}
            </span>
          </div>
        </div>
      )}
      <Image
        src='/images/osu-gif.gif'
        alt='osu gameplay'
        fill={true}
        className='object-cover transition-opacity duration-300'
        style={{ opacity: isGifLoading ? 0 : 1 }}
        onLoad={() => setIsGifLoading(false)}
        unoptimized
        priority={false}
        loading='eager'
      />
      <div className='absolute inset-0 bg-black/20' aria-hidden='true' />
    </div>
  )
}
