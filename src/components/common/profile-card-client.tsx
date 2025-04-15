'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react' // useRef is no longer strictly needed unless you add other interactions
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

export const ProfileHeader = () => {
  const t = useTranslations()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleVideoError = () => {
    toast.error('Video loading/playback error')
    setIsLoading(false)
  }

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
      role="figure"
    >
      {isLoading && LoadingComponent}
      {isClient && (
        <video
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100', // Smooth fade-in
          )}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => { setIsLoading(false); }}
          onError={handleVideoError}
          suppressHydrationWarning
        >
          <source src="/images/header-background.webm" type="video/webm" />
          {/* {t('common.errors.videoNotSupported')} */}
        </video>
      )}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
    </div>
  )
}
