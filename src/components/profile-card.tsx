'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import type { User } from 'osu-api-v2-js'

type ProfileCardProps = {
  osuProfile: User.Extended
}

export function ProfileCard({ osuProfile }: ProfileCardProps) {
  const [isGifLoading, setIsGifLoading] = useState(true)
  const t = useTranslations()

  return (
    <Card className='w-full max-w-2xl mx-auto overflow-hidden pt-0'>
      <div className='aspect-[16/9] relative overflow-hidden bg-muted'>
        {isGifLoading && (
          <div className='absolute inset-0 flex items-center justify-center z-10 bg-muted'>
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <span className='text-sm text-muted-foreground'>
                {t('profile.loading.gameplay')}
              </span>
            </div>
          </div>
        )}
        <Image
          src='/images/osu-gif.gif'
          alt='osu gameplay'
          fill={true}
          className='object-cover transition-opacity duration-300'
          style={{ opacity: isGifLoading ? 0 : 1 }}
          onLoad={() => setIsGifLoading(false)}
          unoptimized
          priority={true}
          loading='eager'
        />
        <div className='absolute inset-0 bg-black/20' />
      </div>

      <CardContent className='pt-0 px-6 pb-6'>
        <div className='flex flex-col items-center -mt-16 relative z-10'>
          <Image
            src='/images/my-icon.png'
            alt='tenzyu profile'
            width={96}
            height={96}
            className='rounded-full border-4 border-background shadow-md bg-white'
            priority={true}
            loading='eager'
            quality={90}
          />
          <div className='flex items-center gap-4 mt-2'>
            <div className='flex flex-col items-center'>
              <div className='text-sm font-medium text-muted-foreground'>
                {t('profile.globalRanking')}
              </div>
              <div className='text-2xl font-bold'>
                #{osuProfile.statistics.global_rank}
              </div>
            </div>

            <div className='h-8 w-px bg-border' />

            <div className='flex flex-col items-center'>
              <div className='flex items-center gap-1'>
                <span className='text-sm font-medium text-muted-foreground'>
                  {t('profile.countryRanking')}
                </span>
              </div>
              <div className='text-2xl font-bold'>
                #{osuProfile.statistics.country_rank}
              </div>
            </div>
          </div>
        </div>

        <div className='text-center mt-4'>
          <h1 className='text-2xl font-bold'>{t('profile.name')}</h1>
          <p className='text-base mt-2'>{t('profile.description')}</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
          <div className='space-y-2'>
            <p className='text-center'>{t('profile.goal')}</p>
            <Button
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
              asChild={true}
            >
              <a
                href='https://osu.ppy.sh/users/23318599'
                target='_blank'
                rel='noreferrer'
              >
                <Image
                  src='/images/osu-logo.png'
                  alt='osu! logo'
                  width={20}
                  height={20}
                  className='rounded-full'
                  priority={false}
                  loading='lazy'
                  quality={75}
                />
                <span>tenzyu</span>
              </a>
            </Button>
          </div>

          <div className='space-y-2'>
            <p className='text-center'>{t('profile.twitchGoal')}</p>
            <Button
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
              asChild={true}
            >
              <a
                href='https://tenzyu.com/u/twitch'
                target='_blank'
                rel='noreferrer'
              >
                <Image
                  src='/images/twitch-logo.png'
                  alt='Twitch logo'
                  width={20}
                  height={20}
                  priority={false}
                  loading='lazy'
                  quality={75}
                />
                <span>tenzyudotcom</span>
              </a>
            </Button>
          </div>
        </div>

        <div className='mt-6 pt-4 border-t'>
          <h3 className='font-medium mb-2'>{t('profile.funFacts')}</h3>
          <ul className='space-y-1 list-disc pl-5'>
            <li>{t('profile.facts.birthdate')}</li>
            <li>{t('profile.facts.osuStart')}</li>
            <li>{t('profile.facts.previousJob')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
