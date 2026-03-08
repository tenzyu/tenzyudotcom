'use client'
// NOTE: なんかハイドレーション失敗するので
// REF: https://chatgpt.com/share/67facaea-bc84-8004-8f02-e99faa5f83e4

import Image from 'next/image'
import { lazy, Suspense } from 'react'
import type { TwitterComponents } from 'react-tweet'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'

import type { TweetData } from '../data/twitter'

const Tweet = lazy(async () => {
  const module = await import('react-tweet')
  return { default: module.Tweet }
})

const twitterComponents: TwitterComponents = {
  AvatarImg: (props) => <Image {...props} loading="lazy" quality={75} alt="" />,
  MediaImg: (props) => (
    <Image
      {...props}
      fill
      unoptimized
      loading="lazy"
      quality={75}
      alt=""
      crossOrigin="anonymous"
    />
  ),
}

function TweetItem({ tweet }: { tweet: TweetData }) {
  return (
    <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
      <Tweet id={tweet.id} components={twitterComponents} />
    </Suspense>
  )
}

type TwitterCarouselClientProps = {
  tweets: TweetData[]
  previousLabel: string
  nextLabel: string
}

export function TwitterCarouselClient({
  tweets,
  previousLabel,
  nextLabel,
}: TwitterCarouselClientProps) {
  return (
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
            <TweetItem tweet={tweet} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 left-4 z-10 -translate-y-1/2 transform"
        label={previousLabel}
      />
      <CarouselNext
        className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 right-4 z-10 -translate-y-1/2 transform"
        label={nextLabel}
      />
    </Carousel>
  )
}
