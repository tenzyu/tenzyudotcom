import { Button } from '@/components/shadcn-ui/button'
import { Card, CardContent } from '@/components/shadcn-ui/card'
import { Skeleton } from '@/components/shadcn-ui/skeleton'

import { getTranslations } from 'next-intl/server'

import Image from 'next/image'
import { Suspense, memo } from 'react'

import { ID_OSU } from '@/data/constants'
import { getUser } from '@/data/osu'
import { ProfileHeader } from './profile-card-client'

const ProfileImage = memo(function ProfileImage() {
  return (
    <Image
      src='/images/my-icon.png'
      alt='tenzyu profile'
      width={96}
      height={96}
      className='rounded-full border-4 border-background shadow-md bg-white'
      priority={false}
      loading='eager'
      quality={90}
    />
  )
})

const SocialButton = memo(function SocialButton({
  href,
  iconSrc,
  iconAlt,
  children,
}: {
  href: string
  iconSrc: string
  iconAlt: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant='outline'
      className='w-full flex items-center justify-center gap-2'
      asChild={true}
    >
      <a
        href={href}
        target='_blank'
        rel='noreferrer'
        aria-label={`Visit ${iconAlt}`}
      >
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={20}
          height={20}
          className='rounded-full'
          loading='lazy'
          quality={75}
        />
        <span>{children}</span>
      </a>
    </Button>
  )
})

export const ProfileCard = memo(async function ProfileCard() {
  const t = await getTranslations()

  return (
    <Card className='w-full max-w-2xl mx-auto overflow-hidden pt-0'>
      <ProfileHeader />

      <CardContent className='pt-0 px-6 pb-6'>
        <div className='flex flex-col items-center -mt-16 relative z-10'>
          <ProfileImage />
          <Suspense fallback={<RankingsSkeleton />}>
            <Rankings />
          </Suspense>
        </div>

        <div className='text-center mt-4'>
          <h1 className='text-2xl font-bold'>{t('profile.name')}</h1>
          <p className='text-base mt-2'>{t('profile.description')}</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
          <div className='space-y-2'>
            <p className='text-center'>{t('profile.goal')}</p>
            <SocialButton
              href='https://osu.ppy.sh/users/23318599'
              iconSrc='/images/osu-logo.png'
              iconAlt='osu! logo here'
            >
              tenzyu
            </SocialButton>
          </div>

          <div className='space-y-2'>
            <p className='text-center'>{t('profile.twitchGoal')}</p>
            <SocialButton
              href='https://tenzyu.com/u/twitch'
              iconSrc='/images/twitch-logo.png'
              iconAlt='Twitch logo here'
            >
              tenzyudotcom
            </SocialButton>
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
})

async function RankingsSkeleton() {
  const t = await getTranslations()
  return (
    <div className='flex items-center gap-4'>
      <div className='flex flex-col items-center'>
        <div className='text-sm font-medium text-muted-foreground'>
          {t('profile.globalRanking')}
        </div>
        <Skeleton className='h-8 w-16' />
      </div>

      <div className='h-8 w-px bg-border' aria-hidden='true' />

      <div className='flex flex-col items-center'>
        <div className='text-sm font-medium text-muted-foreground'>
          {t('profile.countryRanking')}
        </div>
        <Skeleton className='h-8 w-16' />
      </div>
    </div>
  )
}

async function Rankings() {
  const osuProfile = await getUser(ID_OSU)
  const t = await getTranslations()

  return (
    <div className='flex items-center gap-4'>
      <div className='flex flex-col items-center'>
        <div className='text-sm font-medium text-muted-foreground'>
          {t('profile.globalRanking')}
        </div>
        <div className='h-8 text-2xl font-bold'>
          #{osuProfile.statistics.global_rank}
        </div>
      </div>

      <div className='h-8 w-px bg-border' aria-hidden='true' />

      <div className='flex flex-col items-center'>
        <div className='text-sm font-medium text-muted-foreground'>
          {t('profile.countryRanking')}
        </div>
        <div className='h-8 text-2xl font-bold'>
          #{osuProfile.statistics.country_rank}
        </div>
      </div>
    </div>
  )
}
