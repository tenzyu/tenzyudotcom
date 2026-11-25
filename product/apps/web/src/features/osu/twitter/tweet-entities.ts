import type { Tweet } from 'react-tweet/api'

export function normalizeTweetEntities(
  entities: Partial<NonNullable<Tweet['entities']>> = {},
): NonNullable<Tweet['entities']> {
  return {
    ...entities,
    hashtags: entities.hashtags ?? [],
    user_mentions: entities.user_mentions ?? [],
    urls: entities.urls ?? [],
    symbols: entities.symbols ?? [],
  }
}

export function normalizeTweet(tweet: Tweet): Tweet {
  return {
    ...tweet,
    entities: normalizeTweetEntities(tweet.entities),
    ...(tweet.quoted_tweet && {
      quoted_tweet: {
        ...tweet.quoted_tweet,
        entities: normalizeTweetEntities(tweet.quoted_tweet.entities),
      },
    }),
  }
}
