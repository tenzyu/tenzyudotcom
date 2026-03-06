import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { NavigationTiles } from './_components/navigation-tiles'
import { SelfieGallerySection } from './_components/selfie-gallery-section'
import { ExternalLink } from '@/components/site/external-link'
import { SectionHeader } from '@/components/site/section-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ENTRY_LINKS = [
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/tools',
    label: 'Tools',
  },
  {
    href: '/recommendations',
    label: 'Recommendations',
  },
] as const

export default async function Home() {
  const t = await getTranslations('home')
  return (
    <>
      {/* HeroSection */}
      <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center">
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
            <ExternalLink href="https://x.com/FlawInAffection">
              <span className="font-bold tracking-widest">
                @FlawInAffection
              </span>
            </ExternalLink>
          </Button>
        </ButtonGroup>

        <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text font-serif text-sm font-medium text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400">
          {t('slogan')}
        </span>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Now"
          description="今の航路と、触ってほしい入口。"
        />
        <div className="grid gap-4">
          <Card variant="soft" className="h-full">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg">はじめて来た人へ</CardTitle>
              <CardDescription className="text-sm">
                はじめまして、天珠です。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">
              もともと osu!
              プレイヤーでコンテンツを作っていました。今はとくにラベルがありません。AI
              触っています。
              摩擦の少ない生活を目指しています。一緒に頑張りましょう。
            </CardContent>
          </Card>

          <Card variant="soft" className="h-full">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg">今育てているもの</CardTitle>
              <CardDescription className="text-sm">
                置いているのは、日々触っているものだけ。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">
              AIと生活設計 / 個人開発とWeb / 感性の棚。
              <br />
            </CardContent>
          </Card>

          <Card variant="soft" className="h-full">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg">おすすめの入口</CardTitle>
              <CardDescription className="text-sm">
                まず触ってほしい3つ。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {ENTRY_LINKS.map((link) => (
                <Button key={link.href} asChild variant="soft" size="sm">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
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
