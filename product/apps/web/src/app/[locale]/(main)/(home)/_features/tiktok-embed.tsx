import { ExternalLink, Heart, Play } from 'lucide-react'
import { useLocale } from 'next-intlayer/server'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { Dialog, DialogTrigger } from '@tenzyu/ui/dialog'
import { Card } from '@tenzyu/ui/card'
import { ExternalLink as SiteExternalLink } from '@/app/[locale]/_features/external-link'
import { TikTokDialogContent } from '@/app/[locale]/(main)/_features/tiktok/tiktok-dialog-content'
import { formatTikTokLikeCount } from '@/features/tiktok/tiktok.domain'
import type { HomeTikTokCard } from './tiktok.assemble'

type TikTokEmbedItemProps = {
  video: HomeTikTokCard
}

function TikTokThumbnail({
  video,
  overlay,
}: {
  video: HomeTikTokCard
  overlay?: ReactNode
}) {
  const aspectRatio =
    video.width && video.height ? `${video.width} / ${video.height}` : '9 / 16'

  if (!video.thumbnailUrl) {
    return (
      <div className="bg-muted relative w-full" style={{ aspectRatio }}>
        {overlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10">
            {overlay}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio }}>
      <Image
        src={video.thumbnailUrl}
        alt={video.title || 'TikTok thumbnail'}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 33vw"
        unoptimized
        loading="lazy"
      />
      {overlay ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          {overlay}
        </div>
      ) : null}
    </div>
  )
}

function TikTokEmbedItem({ video }: TikTokEmbedItemProps) {
  const { locale } = useLocale()
  const likeCount = formatTikTokLikeCount(video.likeCount, locale)
  const title = video.title || video.id
  const playLabel = locale === 'ja' ? 'TikTok を再生' : 'Play TikTok'
  const fromLabel = 'from TikTok'
  const openOnTikTokLabel = locale === 'ja' ? 'TikTok で開く' : 'Open on TikTok'

  return (
    <Dialog>
      <div className="relative">
        <Card className="group overflow-hidden border p-0">
          <DialogTrigger
            render={
              <button
                type="button"
                className="block w-full text-left"
                aria-label={`${playLabel}: ${title}`}
              >
                <div className="overflow-hidden">
                  <TikTokThumbnail
                    video={video}
                    overlay={
                      <Play className="h-10 w-10 fill-white text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                    }
                  />
                </div>
                <div className="border-border/60 text-muted-foreground flex items-center gap-2 border-t px-3 py-2 text-xs font-medium">
                  <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{likeCount ?? '—'}</span>
                  <span className="text-muted-foreground/70 ml-auto text-[10px] tracking-wide uppercase">
                    {fromLabel}
                  </span>
                </div>
              </button>
            }
          ></DialogTrigger>
        </Card>

        <SiteExternalLink
          href={video.shareUrl}
          aria-label={`${openOnTikTokLabel}: ${title}`}
          className="bg-background/90 text-foreground hover:bg-background absolute top-2 right-2 z-20 inline-flex size-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </SiteExternalLink>
      </div>

      <TikTokDialogContent
        embedUrl={video.embedUrl}
        title={title}
        className="max-w-[calc(100%-1rem)] sm:max-w-md"
        frameClassName="aspect-[9/16] w-full"
        iframeClassName="h-full w-full"
      />
    </Dialog>
  )
}

type TikTokEmbedListProps = {
  videos: HomeTikTokCard[]
}

export function TikTokEmbedList({ videos }: TikTokEmbedListProps) {
  if (videos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {videos.map((video) => (
        <TikTokEmbedItem key={video.id} video={video} />
      ))}
    </div>
  )
}
