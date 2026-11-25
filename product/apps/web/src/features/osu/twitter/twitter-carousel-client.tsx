'use client'

import Image from 'next/image'
import { EmbeddedTweet, type TwitterComponents } from 'react-tweet'
import type { Tweet } from 'react-tweet/api'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@tenzyu/ui/carousel'

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

function TweetItem({
  id,
  tweet,
  viewPostLabel,
}: {
  id: string
  tweet: Tweet | null
  viewPostLabel: string
}) {
  return tweet ? (
    <EmbeddedTweet tweet={tweet} components={twitterComponents} />
  ) : (
    <a href={`https://x.com/i/status/${id}`}>{viewPostLabel}</a>
  )
}

type TwitterCarouselClientProps = {
  tweets: { id: string; tweet: Tweet | null }[]
  viewPostLabel: string
  previousLabel: string
  nextLabel: string
}

export function TwitterCarouselClient({
  tweets,
  viewPostLabel,
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
            <TweetItem
              id={tweet.id}
              tweet={tweet.tweet}
              viewPostLabel={viewPostLabel}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 left-4 z-10 -translate-y-1/2 transform"
        // label={previousLabel}
      />
      <CarouselNext
        className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 right-4 z-10 -translate-y-1/2 transform"
        // label={nextLabel}
      />
    </Carousel>
  )
}
