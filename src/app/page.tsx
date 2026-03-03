import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  ExternalLink,
  Pointer,
  Link as LinkIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/shadcn-ui/badge'
import { Button } from '@/components/shadcn-ui/button'
import { Card } from '@/components/shadcn-ui/card'
import { YouTubeCarousel } from '@/components/social/youtube-carousel'
import { HOME_VIDEOS, HOME_SELFIES } from '@/data/home'

export default async function Home() {
  const t = await getTranslations('home')

  return (
    <div className="flex min-h-[80vh] flex-col items-center pt-8 pb-16">
      <div className="w-full max-w-3xl space-y-16 px-4 pb-12 sm:px-6">
        {/* Hero & Profile Section */}
        <section className="relative space-y-8 pt-8 text-center">
          <div className="flex items-center gap-6">
            <div className="border-background ring-primary/20 mx-auto h-36 w-36 overflow-hidden rounded-full border-4 shadow-2xl ring-4">
              <Image
                src="/images/my-icon.png"
                alt="Profile"
                width={44}
                height={44}
                priority
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="from-primary bg-gradient-to-r via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
                {t('catchphrase')}
              </span>
            </h1>
          </div>

          <div className="items-center justify-center space-y-6">
            <div className="flex items-center gap-6">
              <p className="text-foreground text-3xl font-bold">夢</p>
              <Badge
                variant="secondary"
                className="items-center justify-center px-2 py-1 text-sm font-medium"
              >
                {t('realName')}
              </Badge>

              <Button
                asChild
                className="group rounded-full shadow-md transition-all hover:shadow-lg"
              >
                <a
                  href="https://x.com/FlawInAffection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span className="font-bold">FlawInAffection on X</span>
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Navigation Grid */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: '/links', label: 'Links', icon: LinkIcon },
            { href: '/blog', label: 'Blog', icon: FileText },
            { href: '/tools', label: 'Tools', icon: Hammer },
            { href: '/pointers', label: 'Pointers', icon: Pointer },
            { href: '/portfolio', label: 'Portfolio', icon: Disc },
            { href: '/archives', label: 'Archives', icon: FolderArchive },
          ].map((item) => (
            <Button
              key={item.href}
              variant="outline"
              className="group hover:bg-primary hover:text-primary-foreground h-auto flex-col gap-3 rounded-2xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-6 w-6 opacity-70 transition-transform group-hover:scale-110 group-hover:opacity-100" />
                <span className="text-sm font-bold tracking-wide">
                  {item.label}
                </span>
              </Link>
            </Button>
          ))}
        </section>

        <section className="space-y-6">
          <p className="text-muted-foreground text-sm font-medium italic">
            {t('slogan')}
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t('timeline')}
            </h2>
            <div className="bg-border/50 h-px flex-1"></div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {t('timelineDesc')}
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {HOME_SELFIES.map((selfie) => (
              <Card
                key={selfie.id}
                className="group border-border/40 hover:border-primary/50 h-full overflow-hidden transition-all hover:shadow-md"
              >
                <a
                  href={`https://x.com/FlawInAffection/status/${selfie.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-[4/5] w-full"
                >
                  <Image
                    src={selfie.imageUrl}
                    alt="Selfie"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                    <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                  </div>
                </a>
              </Card>
            ))}
          </div>
        </section>

        {/* Music Recommendations Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{t('music')}</h2>
            <div className="bg-border/50 h-px flex-1"></div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {t('musicDesc')}
          </p>

          <Card className="bg-card/50 overflow-hidden p-6 shadow-sm">
            <YouTubeCarousel videos={HOME_VIDEOS} type="video" />
          </Card>
        </section>

        {/* Footer Link to Archive */}
        <section className="flex justify-center pt-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-primary"
          >
            <Link href="/archives/osu-profile">{t('archiveLink')}</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
