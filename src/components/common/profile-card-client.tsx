'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export const ProfileHeader = () => {
  const [isGifLoading, setIsGifLoading] = useState(true)
  const t = useTranslations()

  return (
    <div
      className="bg-muted relative aspect-[16/9] overflow-hidden"
      aria-label={t('profile.loading.gameplay')}
    >
      {isGifLoading && (
        <div className="bg-muted absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2
              className="text-primary h-8 w-8 animate-spin"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-sm">
              {t('profile.loading.gameplay')}
            </span>
          </div>
        </div>
      )}
      <Image
        src="/images/osu-gif.gif"
        alt="osu gameplay"
        fill
        className="object-cover transition-opacity duration-300"
        style={{ opacity: isGifLoading ? 0 : 1 }}
        onLoad={() => {
          setIsGifLoading(false)
        }}
        unoptimized
        priority={false}
        loading="eager"
      />
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
    </div>
  )
}
