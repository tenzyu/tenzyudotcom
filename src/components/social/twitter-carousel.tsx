import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/shadcn-ui/carousel'
import type { TWEET } from '@/data/twitter'
import { cn } from '@/lib/utils'

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
        <CarouselPrevious className="absolute left-4 top-1/2 z-10 -translate-y-1/2 transform dark:bg-popover dark:text-popover-foreground" />
        <CarouselNext className="absolute right-4 top-1/2 z-10 -translate-y-1/2 transform dark:bg-popover dark:text-popover-foreground" />
      </Carousel>
    </div>
  )
}
