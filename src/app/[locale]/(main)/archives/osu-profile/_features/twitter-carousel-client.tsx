'use client'
// NOTE: なんかハイドレーション失敗するので
// REF: https://chatgpt.com/share/67facaea-bc84-8004-8f02-e99faa5f83e4

import Image from 'next/image'
import { Suspense } from 'react'
import { Tweet, type TwitterComponents } from 'react-tweet'

import { Skeleton } from '@/components/ui/skeleton'

import type { TweetData } from './twitter-carousel'

type TweetItemProps = {
  tweet: TweetData
}

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

export const TweetItem = ({ tweet }: TweetItemProps) => (
  <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
    <Tweet id={tweet.id} components={twitterComponents} />
  </Suspense>
)
