import Image from 'next/image'

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
      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
      alt={title}
      fill
      className={className}
      sizes={sizes}
      loading="lazy"
      quality={quality}
    />
  )
}
