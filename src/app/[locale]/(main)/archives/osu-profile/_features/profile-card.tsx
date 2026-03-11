import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useIntlayer } from 'next-intlayer/server'
import { Suspense } from 'react'

import { Content } from '@/components/site-ui/content'
import { ExternalLink } from '@/components/site-ui/external-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { ID_OSU } from './osu.source'
import { getUser } from './lib/getUser'

const LoadingComponent = () => {
  const profile = useIntlayer('profile')

  return (
    <div className="bg-muted absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2
          className="text-primary h-8 w-8 animate-spin"
          aria-hidden="true"
        />
        <span className="text-muted-foreground text-sm">
          {profile.loading.gameplay}
        </span>
      </div>
    </div>
  )
}

const HeaderBackground = () => {
  const profile = useIntlayer('profile')

  return (
    <video
      className="h-full w-full object-cover transition-opacity duration-300"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      crossOrigin="anonymous"
      aria-label={profile.aria.videoPlayer.value}
    >
      <source src="/header-background.webm" type="video/webm" />
      {profile.aria.videoUnsupported.value}
    </video>
  )
}

function ProfileImage() {
  const profile = useIntlayer('profile')

  return (
    <Image
      src="/images/my-icon.png"
      alt={profile.aria.profileImageAlt.value}
      width={96}
      height={96}
      className="border-background rounded-full border-4 bg-white shadow-md"
      priority={false}
      loading="eager"
      quality={75}
    />
  )
}

function SocialButton({
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
  const profile = useIntlayer('profile')

  return (
    <Button
      variant="soft"
      className="flex w-full items-center justify-center gap-2"
      asChild
    >
      <ExternalLink
        href={href}
        rel="noreferrer"
        aria-label={`${profile.aria.visitPrefix.value} ${iconAlt}`}
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
      </ExternalLink>
    </Button>
  )
}

export const ProfileCard = async () => {
  const profile = useIntlayer('profile')

  return (
    <Content size="2xl">
      <Card className="overflow-hidden pt-0">
        <figure
          className="bg-muted relative aspect-video overflow-hidden"
          aria-label={profile.loading.gameplay.value}
        >
          <Suspense fallback={<LoadingComponent />}>
            <HeaderBackground />
          </Suspense>
          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        </figure>

        <CardContent className="px-6 pt-0 pb-6">
          <div className="relative z-10 -mt-16 flex flex-col items-center">
            <ProfileImage />
            <Suspense fallback={<RankingsSkeleton />}>
              <Rankings />
            </Suspense>
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="mt-2 text-base">{profile.description}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-center">{profile.goal}</p>
              <SocialButton
                href="https://osu.ppy.sh/users/23318599"
                iconSrc="/images/osu-logo.png"
                iconAlt={profile.aria.osuLogoAlt.value}
              >
                tenzyu
              </SocialButton>
            </div>

            <div className="space-y-2">
              <p className="text-center">{profile.twitchGoal}</p>
              <SocialButton
                href="https://tenzyu.com/u/twitch"
                iconSrc="/images/twitch-logo.png"
                iconAlt={profile.aria.twitchLogoAlt.value}
              >
                tenzyudotcom
              </SocialButton>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h3 className="mb-2 font-medium">{profile.funFacts}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{profile.facts.birthdate}</li>
              <li>{profile.facts.osuStart}</li>
              <li>{profile.facts.standingUp}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </Content>
  )
}

async function RankingsSkeleton() {
  const profile = useIntlayer('profile')
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {profile.globalRanking}
        </div>
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="bg-border h-8 w-px" aria-hidden="true" />

      <div className="flex flex-col items-center">
        <div className="text-muted-foreground text-sm font-medium">
          {profile.countryRanking}
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

async function Rankings() {
  const profile = useIntlayer('profile')

  try {
    const osuProfile = await getUser(ID_OSU)

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="text-muted-foreground text-sm font-medium">
            {profile.globalRanking}
          </div>
          <div className="h-8 text-2xl font-bold">
            #{osuProfile.statistics.global_rank}
          </div>
        </div>

        <div className="bg-border h-8 w-px" aria-hidden="true" />

        <div className="flex flex-col items-center">
          <div className="text-muted-foreground text-sm font-medium">
            {profile.countryRanking}
          </div>
          <div className="h-8 text-2xl font-bold">
            #{osuProfile.statistics.country_rank}
          </div>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="text-muted-foreground text-sm font-medium">
            {profile.globalRanking}
          </div>
          <div className="h-8 text-2xl font-bold">-</div>
        </div>

        <div className="bg-border h-8 w-px" aria-hidden="true" />

        <div className="flex flex-col items-center">
          <div className="text-muted-foreground text-sm font-medium">
            {profile.countryRanking}
          </div>
          <div className="h-8 text-2xl font-bold">-</div>
        </div>
      </div>
    )
  }
}
