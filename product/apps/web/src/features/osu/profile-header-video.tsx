'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@tenzyu/ui/button'

type Props = {
  label: string
  unsupported: string
  playLabel: string
  pauseLabel: string
}

export function ProfileHeaderVideo({
  label,
  unsupported,
  playLabel,
  pauseLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      if (preference.matches) video.pause()
      else void video.play().catch(() => {})
    }
    apply()
    preference.addEventListener('change', apply)
    return () => preference.removeEventListener('change', apply)
  }, [])

  return (
    <>
      {/* Start playback only after checking the user's motion preference. */}
      <video
        ref={ref}
        className="h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none"
        loop
        muted
        playsInline
        preload="none"
        crossOrigin="anonymous"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/header-background.webm" type="video/webm" />
        {unsupported}
      </video>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute top-3 right-3 z-10"
        onClick={() => {
          const video = ref.current
          if (!video) return
          if (video.paused) void video.play().catch(() => {})
          else video.pause()
        }}
      >
        {playing ? pauseLabel : playLabel}
      </Button>
    </>
  )
}
