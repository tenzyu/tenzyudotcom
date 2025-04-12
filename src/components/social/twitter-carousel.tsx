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

type TwitterCarouselProps = {
  tweets: TWEET[]
}

const twitterComponents: TwitterComponents = {
  AvatarImg: (props) => (
    <Image {...props} priority={false} loading="lazy" quality={75} />
  ),
  MediaImg: (props) => (
    <Image
      {...props}
      fill
      unoptimized
      priority={false}
      loading="lazy"
      quality={75}
    />
  ),
}

export function TwitterCarousel({ tweets }: TwitterCarouselProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="relative"
      >
        <CarouselContent>
          {tweets.map((tweet) => (
            <CarouselItem
              key={tweet.id}
              className="select-none md:basis-1/2 lg:basis-1/2"
            >
              <Suspense
                fallback={
                  <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
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
        <CarouselPrevious className="dark:font-white absolute top-1/2 left-4 z-10 -translate-y-1/2 transform dark:bg-black" />
        <CarouselNext className="dark:font-white absolute top-1/2 right-4 z-10 -translate-y-1/2 transform dark:bg-black" />
      </Carousel>
    </div>
  )
}
