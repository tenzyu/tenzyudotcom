import { Gamepad2, MapPin, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { NavigationTiles } from './_components/navigation-tiles'
import { SelfieGallerySection } from './_components/selfie-gallery-section'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'

export default async function Home() {
  const t = await getTranslations('home')
  return (
    <>
      {/* HeroSection */}
      <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center sm:py-12">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
          <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
            <Avatar className="h-full w-full">
              <AvatarImage src="/images/ltvgbz.jpg" alt="Profile" />
              <AvatarFallback>TN</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <h1 className="font-serif text-4xl font-black tracking-tighter text-balance sm:text-5xl md:text-7xl">
          <span className="bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text px-2 pb-2 text-transparent drop-shadow-sm dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400">
            {t('catchphrase')}
          </span>
        </h1>

        <ButtonGroup className="flex-row-2 mt-6 items-center justify-center gap-3 sm:max-w-none">
          <Button variant="soft" size="lg" className="shadow-sm">
            <span className="text-foreground text-sm font-bold tracking-widest">
              夢
            </span>
            <Badge className="bg-background/50 text-foreground border-border dark:bg-background/50 dark:border-border/50 ml-1">
              {t('realName')}
            </Badge>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="shadow-md transition-transform hover:scale-105"
          >
            <a
              href="https://x.com/FlawInAffection"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="font-bold tracking-widest">
                @FlawInAffection
              </span>
            </a>
          </Button>
        </ButtonGroup>

        <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text font-serif text-sm font-medium text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400">
          {t('slogan')}
        </span>

        <Card variant="soft" className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-left text-xl font-bold tracking-tight">
              <div className="flex flex-wrap items-center gap-3">
                <MapPin className="text-primary h-7 w-7 shrink-0" />
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="decoration-border/70 cursor-help text-left underline decoration-dashed underline-offset-4">
                      Now in Tokyo, Japan
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm leading-relaxed">
                    {t('slogan')}
                  </HoverCardContent>
                </HoverCard>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="text-muted-foreground space-y-4 text-left text-sm/relaxed">
            <p className="flex items-center gap-3">
              <Sparkles className="text-primary h-4 w-4 shrink-0" />
              <span>
                Exploring the mindset and possibilities of using AI.
                <span className="mt-1 block text-xs opacity-70">
                  (By the way, this site is also built using AI)
                </span>
              </span>
            </p>
            <Separator className="bg-border/50" />
            <p className="flex items-center gap-3">
              <Gamepad2 className="text-primary h-4 w-4 shrink-0" />
              <span>
                AIとサイトと生活設計を使って、摩擦の少ない、自分主導の収益と居場所を作ろうとしてる
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="py-4" />

      <NavigationTiles />

      <div className="py-4" />

      <SelfieGallerySection
        title={t('timeline')}
        description={t('timelineDesc')}
      />
    </>
  )
}
