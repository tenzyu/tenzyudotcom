'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Tweet } from 'react-tweet'

import type { TWEET } from '@/data/twitter'

interface TwitterCarouselProps {
  tweets: TWEET[]
}

export function TwitterCarousel({ tweets }: TwitterCarouselProps) {
  return (
    <div className='w-full max-w-4xl mx-auto'>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className='relative'
      >
        <CarouselContent>
          {tweets.map(tweet => (
            <CarouselItem key={tweet.id} className='md:basis-1/2 lg:basis-1/2'>
              {/* <div className="flex justify-center p-2">
              <div className="w-full max-w-[550px]"> */}
              <Tweet id={tweet.id} />
              {/* </div>
            </div> */}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='absolute left-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white' />
        <CarouselNext className='absolute right-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white' />
      </Carousel>
    </div>
  )
}
