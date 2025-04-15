import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/shadcn-ui/carousel'
import { cn } from '@/lib/utils'

import type { TWEET } from '@/data/twitter'

import { TweetItem } from './twitter-carousel-client'

type TwitterCarouselProps = {
  tweets: TWEET[]
  className?: string
}

export function TwitterCarousel({ tweets, className }: TwitterCarouselProps) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
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
        <CarouselPrevious className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 left-4 z-10 -translate-y-1/2 transform" />
        <CarouselNext className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 right-4 z-10 -translate-y-1/2 transform" />
      </Carousel>
    </div>
  )
}
