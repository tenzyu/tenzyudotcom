import Image from 'next/image'
import { Heart } from 'lucide-react'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { getTweet } from 'react-tweet/api'
import { useIntlayer, useLocale } from 'next-intlayer/server'

type TweetImageProps = {
  id: string
  overlay?: ReactNode
  showLikes?: boolean
}

const TweetImageComponent = async ({
  id,
  overlay,
  showLikes,
}: TweetImageProps) => {
  const { locale } = useLocale()
  const content = useIntlayer('tweetImage')
  const tweet = await getTweet(id)
  const media = tweet?.mediaDetails?.[0]
  if (!media) return null

  const url = media.media_url_https
  const width = media.original_info.width || 400
  const height = media.original_info.height || 400
  const metrics = tweet as {
    favoriteCount?: number
    likeCount?: number
    favorite_count?: number
    like_count?: number
  } | null
  const likeCount =
    metrics?.favoriteCount ??
    metrics?.likeCount ??
    metrics?.favorite_count ??
    metrics?.like_count
  const formattedLikes =
    typeof likeCount === 'number'
      ? new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US').format(
          likeCount,
        )
      : null

  return (
    <div className="flex flex-col">
      <div className="relative">
        <Image
          src={url}
          width={width}
          height={height}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
          unoptimized
          loading="lazy"
          quality={75}
          alt=""
          crossOrigin="anonymous"
        />
        {overlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            {overlay}
          </div>
        ) : null}
      </div>
      {showLikes ? (
        <div className="border-border/60 text-muted-foreground flex items-center gap-2 border-t px-3 py-2 text-xs font-medium">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formattedLikes ?? '—'}</span>
          <span className="text-muted-foreground/70 ml-auto text-[10px] tracking-wide uppercase">
            {content.fromLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export const TweetImage = ({ id, overlay, showLikes }: TweetImageProps) => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col">
          <div className="bg-muted aspect-3/4 w-full" />
          {showLikes ? (
            <div className="border-border/60 text-muted-foreground flex items-center gap-2 border-t px-3 py-2 text-xs">
              <span className="bg-muted h-3 w-10 rounded" />
            </div>
          ) : null}
        </div>
      }
    >
      <TweetImageComponent id={id} overlay={overlay} showLikes={showLikes} />
    </Suspense>
  )
}
