'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import { useState } from 'react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/shadcn-ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn-ui/dialog'
import type { YouTube } from '@/data/youtube'

type YouTubeCarouselProps = {
  videos: YouTube[]
  type?: 'video' | 'short'
}

export function YouTubeCarousel({
  videos,
  type = 'video',
}: YouTubeCarouselProps) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({})

  const handleOpenChange = (videoId: string, isOpen: boolean) => {
    setOpenDialogs((prev) => ({
      ...prev,
      [videoId]: isOpen,
    }))
  }

  const isShort = type === 'short'
  const aspectRatio = isShort ? 'aspect-[9/16]' : 'aspect-video'
  // NOTE: あとで cn 使う
  const itemClass = isShort
    ? 'basis-1/2 md:basis-1/3 lg:basis-1/4 select-none'
    : 'md:basis-1/2 lg:basis-1/2 select-none'

  return (
    <div className={`w-full max-w-${isShort ? '3xl' : '4xl'} mx-auto`}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="relative"
      >
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem key={video.id} className={itemClass}>
              <Dialog
                open={openDialogs[video.id]}
                onOpenChange={(isOpen) => {
                  handleOpenChange(video.id, isOpen)
                }}
              >
                <DialogTrigger asChild>
                  <div className="group relative cursor-pointer overflow-hidden rounded-lg">
                    <div className={`relative ${aspectRatio}`}>
                      <Image
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        fill
                        className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ objectPosition: 'center' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        loading="lazy"
                        quality={75}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600">
                          {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                          <svg
                            className="h-6 w-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3
                        className={`${isShort ? 'text-xs' : 'text-lg'} line-clamp-1 font-medium`}
                      >
                        {video.title}
                      </h3>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent
                  className={`${isShort ? 'max-h-[90vh] bg-black p-0 sm:max-w-md' : 'min-w-screen border-black bg-black p-0 md:min-w-[90vw] md:border-white md:bg-white md:p-4'} overflow-hidden`}
                >
                  <VisuallyHidden>
                    <DialogTitle />
                  </VisuallyHidden>
                  <div
                    className={`${isShort ? 'aspect-[9/16] w-full max-w-[350px]' : 'aspect-video w-full md:p-5'} mx-auto`}
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
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className={`absolute ${isShort ? 'left-2' : 'left-4'} dark:font-white top-1/2 z-10 -translate-y-1/2 transform dark:bg-black`}
        />
        <CarouselNext
          className={`absolute ${isShort ? 'right-2' : 'right-4'} dark:font-white top-1/2 z-10 -translate-y-1/2 transform dark:bg-black`}
        />
      </Carousel>
    </div>
  )
}
