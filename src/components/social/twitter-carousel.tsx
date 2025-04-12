'use client'

import Image from 'next/image'
import { Suspense } from 'react'
import { Tweet, type TwitterComponents } from 'react-tweet'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/shadcn-ui/carousel'
import type { TWEET } from '@/data/twitter'

interface TwitterCarouselProps {
  tweets: TWEET[]
}

const twitterComponents: TwitterComponents = {
  AvatarImg: props => (
    <Image {...props} priority={false} loading='lazy' quality={75} />
  ),
  MediaImg: props => (
    <Image
      {...props}
      fill={true}
      unoptimized={true}
      priority={false}
      loading='lazy'
      quality={75}
    />
  ),
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
            <CarouselItem
              key={tweet.id}
              className='md:basis-1/2 lg:basis-1/2 select-none'
            >
              <Suspense
                fallback={
                  <div className='h-[300px] w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg' />
                }
              >
                <Tweet
                  id={tweet.id}
                  fetchOptions={{ next: { revalidate: 60 } }}
                  components={twitterComponents}
                />
              </Suspense>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='absolute left-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white' />
        <CarouselNext className='absolute right-4 top-1/2 transform -translate-y-1/2 z-10 dark:bg-black dark:font-white' />
      </Carousel>
    </div>
  )
}
