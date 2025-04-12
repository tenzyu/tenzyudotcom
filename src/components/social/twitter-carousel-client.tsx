'use client'
// NOTE: なんかハイドレーション失敗するので
// REF: https://chatgpt.com/share/67facaea-bc84-8004-8f02-e99faa5f83e4

import Image from 'next/image'
import { Suspense } from 'react'
import { Tweet, type TwitterComponents } from 'react-tweet'

import type { TWEET } from '@/data/twitter'

type TweetItemProps = {
  tweet: TWEET
}

const twitterComponents: TwitterComponents = {
  AvatarImg: (props) => <Image {...props} loading="lazy" quality={75} />,
  MediaImg: (props) => (
    <Image
      {...props}
      fill
      unoptimized
      loading="lazy"
      quality={75}
      crossOrigin="anonymous"
    />
  ),
}

export const TweetItem = ({ tweet }: TweetItemProps) => (
  <Suspense
    fallback={
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
    }
  >
    <Tweet id={tweet.id} components={twitterComponents} />
  </Suspense>
)
