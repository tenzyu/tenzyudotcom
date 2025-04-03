"use client"

import { useState } from "react"
import Image from "next/image"
import type { YouTube } from "@/data/youtube"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface YouTubeShortsCarouselProps {
  videos: YouTube[]
}

export function YouTubeShortsCarousel({ videos }: YouTubeShortsCarouselProps) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({})

  const handleOpenChange = (videoId: string, isOpen: boolean) => {
    setOpenDialogs((prev) => ({
      ...prev,
      [videoId]: isOpen,
    }))
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="relative"
      >
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem key={video.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              <Dialog open={openDialogs[video.id]} onOpenChange={(isOpen) => handleOpenChange(video.id, isOpen)}>
                <DialogTrigger asChild>
                  <div className="relative overflow-hidden rounded-lg cursor-pointer group">
                    <div className="aspect-[9/16] relative">
                      <Image
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ objectPosition: "center" }}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-medium line-clamp-1">{video.title}</h3>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] p-0 bg-black overflow-hidden">
                  <div className="aspect-[9/16] w-full max-w-[350px] mx-auto">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/3 transform -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 top-1/3 transform -translate-y-1/2 z-10" />
      </Carousel>
    </div>
  )
}

