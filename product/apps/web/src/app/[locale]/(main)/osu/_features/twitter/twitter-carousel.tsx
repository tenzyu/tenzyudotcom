import { useIntlayer } from 'next-intlayer/server'
import { getTweet } from 'react-tweet/api'
import { Content } from '@/components/site/content'
import type { TweetData } from '../twitter.source'
import { TwitterCarouselClient } from './twitter-carousel-client'
import { normalizeTweet } from './tweet-entities'

type TwitterCarouselProps = {
  tweets: TweetData[]
  className?: string
}

export async function TwitterCarousel({
  tweets,
  className,
}: TwitterCarouselProps) {
  const content = useIntlayer('twitterCarousel')
  const resolvedTweets = await Promise.all(
    tweets.map(async ({ id }) => {
      const tweet = await getTweet(id)
      return { id, tweet: tweet ? normalizeTweet(tweet) : null }
    }),
  )

  return (
    <Content size="2xl" className={className}>
      <TwitterCarouselClient
        tweets={resolvedTweets}
        viewPostLabel={content.viewPost.value}
        previousLabel={content.previous.value}
        nextLabel={content.next.value}
      />
    </Content>
  )
}
