import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Content } from '@/components/site/content'

export type TweetData = {
  id: string
}

import { TweetItem } from './twitter-carousel-client'

type TwitterCarouselProps = {
  tweets: TweetData[]
  className?: string
}

export function TwitterCarousel({ tweets, className }: TwitterCarouselProps) {
  return (
    <Content size="4xl" className={className}>
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
    </Content>
  )
}
