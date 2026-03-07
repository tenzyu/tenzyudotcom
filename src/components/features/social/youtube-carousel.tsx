import Image from 'next/image'
import { useIntlayer } from 'next-intlayer/server'
import { VisuallyHidden } from 'radix-ui'
import { Content } from '@/components/site/content'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type YouTubeVideo = {
  id: string
  title: string
}

type YouTubeCarouselProps = {
  videos: YouTubeVideo[]
  type?: 'video' | 'short'
}

type VideoThumbnailProps = {
  video: YouTubeVideo
  isShort: boolean
}

const VideoThumbnail = ({ video, isShort }: VideoThumbnailProps) => (
  <div className="group relative cursor-pointer overflow-hidden rounded-lg">
    <div className={cn('relative', isShort ? 'aspect-9/16' : 'aspect-video')}>
      <Image
        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
        alt={video.title}
        fill
        className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
        style={{ objectPosition: 'center' }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        quality={75}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600">
          <svg
            className="h-6 w-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
    <div className="p-2">
      <h3
        className={cn(
          'text-foreground line-clamp-1 font-medium',
          isShort ? 'text-xs' : 'text-lg',
        )}
      >
        {video.title}
      </h3>
    </div>
  </div>
)

type VideoDialogContentProps = {
  video: YouTubeVideo
  isShort: boolean
}

const VideoDialogContent = ({ video, isShort }: VideoDialogContentProps) => (
  <DialogContent
    className={cn(
      'overflow-hidden',
      isShort
        ? 'max-h-[90vh] bg-black p-0 sm:max-w-md'
        : 'dark:border-border dark:bg-background min-w-screen border-black bg-black p-0 md:min-w-[90vw] md:border-white md:bg-white md:p-4 md:dark:p-4',
    )}
  >
    <VisuallyHidden.Root>
      <DialogTitle>{video.title}</DialogTitle>
    </VisuallyHidden.Root>
    <div
      className={cn(
        'mx-auto',
        isShort
          ? 'aspect-9/16 w-full max-w-[350px]'
          : 'aspect-video w-full md:p-5',
      )}
    >
      <iframe
        width="100%"
        height="100%"
        className="rounded-lg border-0"
        src={`https://www.youtube.com/embed/${video.id}?autoplay=1${isShort ? '&rel=0&modestbranding=1' : ''}`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  </DialogContent>
)

export function YouTubeCarousel({
  videos,
  type = 'video',
}: YouTubeCarouselProps) {
  const content = useIntlayer('youtubeCarousel')
  const isShort = type === 'short'

  return (
    <Content size={isShort ? '3xl' : '4xl'}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="relative"
      >
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem
              key={video.id}
              className={cn(
                'select-none',
                isShort
                  ? 'basis-1/2 md:basis-1/3 lg:basis-1/4'
                  : 'md:basis-1/2 lg:basis-1/2',
              )}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <VideoThumbnail video={video} isShort={isShort} />
                </DialogTrigger>
                <VideoDialogContent video={video} isShort={isShort} />
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className={cn(
            'dark:bg-popover dark:text-popover-foreground absolute top-1/2 z-10 -translate-y-1/2 transform',
            isShort ? 'left-2' : 'left-4',
          )}
          label={content.previous.value}
        />
        <CarouselNext
          className={cn(
            'dark:bg-popover dark:text-popover-foreground absolute top-1/2 z-10 -translate-y-1/2 transform',
            isShort ? 'right-2' : 'right-4',
          )}
          label={content.next.value}
        />
      </Carousel>
    </Content>
  )
}
