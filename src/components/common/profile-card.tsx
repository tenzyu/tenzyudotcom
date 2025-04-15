import { list } from '@vercel/blob'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Suspense, memo } from 'react'

import { Button } from '@/components/shadcn-ui/button'
import { Card, CardContent } from '@/components/shadcn-ui/card'
import { Skeleton } from '@/components/shadcn-ui/skeleton'
import { ID_OSU } from '@/data/constants'
import { getUser } from '@/data/osu'

const LoadingComponent = async () => {
  const t = await getTranslations()

  return (
    <div className="bg-muted absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2
          className="text-primary h-8 w-8 animate-spin"
          aria-hidden="true"
        />
        <span className="text-muted-foreground text-sm">
          {t('profile.loading.gameplay')}
        </span>
      </div>
    </div>
  )
}

const HeaderBackground = async () => {
  const { blobs } = await list({
    prefix: 'header-background.webm',
    limit: 1,
  })
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { url } = blobs.pop()!

  return (
    <video
      className="h-full w-full object-cover transition-opacity duration-300"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      aria-label="Video player"
    >
      <source src={url} type="video/webm" />
      Your browser does not support the video tag.
    </video>
  )
}

const ProfileImage = memo(function ProfileImage() {
  return (
    <Image
      src="/images/my-icon.png"
      alt="tenzyu profile"
      width={96}
      height={96}
      className="border-background rounded-full border-4 bg-white shadow-md"
      priority={false}
      loading="eager"
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
      variant="outline"
      className="flex w-full items-center justify-center gap-2"
      asChild
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Visit ${iconAlt}`}
      >
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={20}
          height={20}
          className="rounded-full"
          loading="lazy"
          quality={75}
        />
        <span>{children}</span>
      </a>
    </Button>
  )
})

export const ProfileCard = async () => {
  const t = await getTranslations()

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden pt-0">
      <div
        className="bg-muted relative aspect-[16/9] overflow-hidden"
        aria-label={t('profile.loading.gameplay')}
        role="figure"
      >
        <Suspense fallback={<LoadingComponent />}>
          <HeaderBackground />
        </Suspense>
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      </div>

      <CardContent className="px-6 pt-0 pb-6">
        <div className="relative z-10 -mt-16 flex flex-col items-center">
          <ProfileImage />
          <Suspense fallback={<RankingsSkeleton />}>
            <Rankings />
          </Suspense>
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-bold">{t('profile.name')}</h1>
          <p className="mt-2 text-base">{t('profile.description')}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-center">{t('profile.goal')}</p>
            <SocialButton
              href="https://osu.ppy.sh/users/23318599"
              iconSrc="/images/osu-logo.png"
              iconAlt="osu! logo here"
            >
              tenzyu
            </SocialButton>
          </div>

          <div className="space-y-2">
            <p className="text-center">{t('profile.twitchGoal')}</p>
            <SocialButton
              href="https://tenzyu.com/u/twitch"
              iconSrc="/images/twitch-logo.png"
              iconAlt="Twitch logo here"
            >
              tenzyudotcom
            </SocialButton>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="mb-2 font-medium">{t('profile.funFacts')}</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('profile.facts.birthdate')}</li>
            <li>{t('profile.facts.osuStart')}</li>
            <li>{t('profile.facts.previousJob')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

async function RankingsSkeleton() {
  const t = await getTranslations()
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {t('profile.globalRanking')}
        </div>
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="bg-border h-8 w-px" aria-hidden="true" />

      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {t('profile.countryRanking')}
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

async function Rankings() {
  const osuProfile = await getUser(ID_OSU)
  const t = await getTranslations()

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {t('profile.globalRanking')}
        </div>
        <div className="h-8 text-2xl font-bold">
          #{osuProfile.statistics.global_rank}
        </div>
      </div>

      <div className="bg-border h-8 w-px" aria-hidden="true" />

      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {t('profile.countryRanking')}
        </div>
        <div className="h-8 text-2xl font-bold">
          #{osuProfile.statistics.country_rank}
        </div>
      </div>
    </div>
  )
}
