'use client'

import { EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Tweet } from 'react-tweet'

export function SpoilerTweet({ id }: { id: string }) {
  const t = useTranslations('home')
  const [revealed, setRevealed] = useState(false)

  if (!revealed) {
    return (
      <div
        className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10 flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border transition-colors"
        onClick={() => {
          setRevealed(true)
        }}
      >
        <EyeOff className="text-destructive/70 h-8 w-8" />
        <div className="text-center">
          <p className="text-destructive font-bold">{t('sensitive')}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('sensitiveDesc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <Tweet id={id} />
    </div>
  )
}
