'use client'

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
import type { YouTube } from '@/data/youtube'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import { useState } from 'react'

interface YouTubeCarouselProps {
  videos: YouTube[]
  type?: 'video' | 'short'
}

export function YouTubeCarousel({
  videos,
  type = 'video',
}: YouTubeCarouselProps) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({})

  const handleOpenChange = (videoId: string, isOpen: boolean) => {
    setOpenDialogs(prev => ({
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
        className='relative'
      >
        <CarouselContent>
          {videos.map(video => (
            <CarouselItem key={video.id} className={itemClass}>
              <Dialog
                open={openDialogs[video.id]}
                onOpenChange={isOpen => handleOpenChange(video.id, isOpen)}
              >
                <DialogTrigger asChild={true}>
                  <div className='relative overflow-hidden rounded-lg cursor-pointer group'>
                    <div className={`relative ${aspectRatio}`}>
                      <Image
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        fill={true}
                        className='object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg'
                        style={{ objectPosition: 'center' }}
                        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                        priority={false}
                        loading='lazy'
                        quality={75}
                      />
                      <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                        <div className='w-12 h-12 rounded-full bg-red-600 flex items-center justify-center'>
                          {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                          <svg
                            className='w-6 h-6 text-white'
                            fill='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path d='M8 5v14l11-7z' />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className='p-2'>
                      <h3
                        className={`${isShort ? 'text-xs' : 'text-lg'} font-medium line-clamp-1`}
                      >
                        {video.title}
                      </h3>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent
                  className={`${isShort ? 'sm:max-w-md max-h-[90vh] p-0 bg-black' : 'min-w-screen md:min-w-[90vw] p-0 md:p-4 border-black bg-black md:bg-white md:border-white'} overflow-hidden`}
                >
                  <VisuallyHidden>
                    <DialogTitle />
                  </VisuallyHidden>
                  <div
                    className={`${isShort ? 'aspect-[9/16] w-full max-w-[350px]' : 'w-full aspect-video md:p-5'} mx-auto`}
                  >
                    <iframe
                      width='100%'
                      height='100%'
                      className='border-0 rounded-lg'
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1${isShort ? '&rel=0&modestbranding=1' : ''}`}
                      title={video.title}
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                      allowFullScreen={true}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className={`absolute ${isShort ? 'left-2' : 'left-4'} top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white`}
        />
        <CarouselNext
          className={`absolute ${isShort ? 'right-2' : 'right-4'} top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white`}
        />
      </Carousel>
    </div>
  )
}
