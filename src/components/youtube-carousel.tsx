"use client"

import type { YouTube } from "@/data/youtube"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { YouTubeDialog } from "./youtube-dialog"

interface YouTubeCarouselProps {
  videos: YouTube[]
}

export function YouTubeCarousel({ videos }: YouTubeCarouselProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="relative"
      >
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/2">
              <YouTubeDialog video={video} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white" />
        <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white" />

      </Carousel>
    </div>
  )
}

