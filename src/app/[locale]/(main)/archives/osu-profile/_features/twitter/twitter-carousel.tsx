import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import type { TweetData } from '../twitter.source'
import { TwitterCarouselClient } from './twitter-carousel-client'

type TwitterCarouselProps = {
  tweets: TweetData[]
  className?: string
}

export function TwitterCarousel({ tweets, className }: TwitterCarouselProps) {
  const content = useIntlayer('twitterCarousel')

  return (
    <Content size="4xl" className={className}>
      <TwitterCarouselClient
        tweets={tweets}
        previousLabel={content.previous.value}
        nextLabel={content.next.value}
      />
    </Content>
  )
}
