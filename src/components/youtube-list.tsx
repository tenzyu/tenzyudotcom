'use client'


import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

import { YouTubeDialog } from "@/components/youtube-dialog"
import type { YouTube } from "@/data/youtube"

export const YouTubeList = ({ list }: { list: YouTube[] }) => {
    return (
        <Carousel
            className="w-full"
            opts={{
                align: "start",
                loop: true,
            }}
        >
            <CarouselContent className="max-w-[450px]">
                {list.map((youtube, index) => (
                    <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3 min-w-[450px]">
                        <div className="p-1">
                            <YouTubeDialog {...youtube} />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="ml-20" />
            <CarouselNext className="mr-10"/>
        </Carousel>
    )
}
