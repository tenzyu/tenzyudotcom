import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site/content'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

export type TweetData = {
  id: string
}

import { TweetItem } from './twitter-carousel-client'

type TwitterCarouselProps = {
  tweets: TweetData[]
  className?: string
}

export function TwitterCarousel({ tweets, className }: TwitterCarouselProps) {
  const content = useIntlayer('twitterCarousel')

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
        <CarouselPrevious
          className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 left-4 z-10 -translate-y-1/2 transform"
          label={content.previous.value}
        />
        <CarouselNext
          className="dark:bg-popover dark:text-popover-foreground absolute top-1/2 right-4 z-10 -translate-y-1/2 transform"
          label={content.next.value}
        />
      </Carousel>
    </Content>
  )
}
