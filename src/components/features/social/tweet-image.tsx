import Image from 'next/image'
import { Suspense } from 'react'
import { getTweet } from 'react-tweet/api'

const TweetImageComponent = async ({ id }: { id: string }) => {
  const tweet = await getTweet(id)
  const media = tweet?.mediaDetails?.[0]
  if (!media) return null

  const url = media.media_url_https
  const width = media.original_info.width || 400
  const height = media.original_info.height || 400

  return (
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
  )
}

export const TweetImage = ({ id }: { id: string }) => {
  return (
    <Suspense fallback={<div className="bg-muted aspect-3/4 w-full" />}>
      <TweetImageComponent id={id} />
    </Suspense>
  )
}
