import Image from 'next/image'
import { buildYouTubeThumbnailUrl } from './youtube.domain'

type YouTubeThumbnailImageProps = {
  videoId: string
  title: string
  className?: string
  sizes: string
  quality?: number
}

export function YouTubeThumbnailImage({
  videoId,
  title,
  className,
  sizes,
  quality = 75,
}: YouTubeThumbnailImageProps) {
  return (
    <Image
      src={buildYouTubeThumbnailUrl(videoId)}
      alt={title}
      fill
      className={className}
      sizes={sizes}
      loading="lazy"
      quality={quality}
    />
  )
}
