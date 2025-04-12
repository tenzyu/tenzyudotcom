'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ImageWithLoading } from '@/components/common/image-with-loading'

export const ProfileHeader = () => {
  const t = useTranslations()

  const LoadingComponent = (
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
  )

  return (
    <div
      className="bg-muted relative aspect-[16/9] overflow-hidden"
      aria-label={t('profile.loading.gameplay')}
    >
      <ImageWithLoading
        src="/images/osu-gif.gif"
        alt="osu gameplay"
        fill
        className="object-cover transition-opacity duration-300"
        unoptimized
        loading="lazy"
        loadingComponent={LoadingComponent}
      />
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
    </div>
  )
}
