import { Disc, FileText, FolderArchive, Hammer, Twitter } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Tweet } from 'react-tweet'

import { SpoilerTweet } from '@/components/social/spoiler-tweet'

export default async function Home() {
  const t = await getTranslations('home')

  return (
    <div className="flex min-h-[80vh] flex-col items-center pt-8 pb-16">
      {/* Twitter Header Image */}
      <div className="bg-muted/30 relative h-32 w-full max-w-3xl overflow-hidden rounded-t-2xl md:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://x.com/FlawInAffection/header_photo"
          alt="Header"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="w-full max-w-2xl space-y-12 px-4 pb-12 sm:px-6">
        {/* Hero & Profile Section */}
        <section className="relative -mt-12 space-y-6 text-center sm:-mt-16 md:text-left">
          <div className="border-background bg-muted mx-auto h-24 w-24 overflow-hidden rounded-full border-4 sm:h-32 sm:w-32 md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://x.com/FlawInAffection/photo"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-4 pt-2">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="from-foreground via-primary to-primary/60 bg-gradient-to-br bg-clip-text text-transparent drop-shadow-sm">
                {t('catchphrase')}
              </span>
            </h1>

            <div className="text-muted-foreground flex flex-col items-center gap-3 md:items-start">
              <p className="text-foreground text-xl font-bold">
                夢{' '}
                <span className="ml-2 text-sm font-medium opacity-70">
                  {t('realName')}
                </span>
              </p>
              <a
                href="https://x.com/FlawInAffection"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-muted/60 hover:bg-primary/10 hover:text-primary flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <Twitter className="h-4 w-4" />
                <span className="font-mono">@FlawInAffection</span>
              </a>
            </div>
          </div>
        </section>

        {/* Navigation Grid (Violet Hover Accent) */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: '/blog', label: 'Blog', icon: FileText },
            { href: '/portfolio', label: 'Portfolio', icon: Disc },
            { href: '/tools', label: 'Tools', icon: Hammer },
            { href: '/archives', label: 'Archives', icon: FolderArchive },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group border-border/50 bg-card hover:border-primary/50 hover:bg-primary hover:text-primary-foreground flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <item.icon className="h-6 w-6 opacity-70 transition-transform group-hover:scale-110 group-hover:opacity-100" />
              <span className="text-sm font-bold tracking-wide">
                {item.label}
              </span>
            </Link>
          ))}
        </section>

        {/* Expanded LinkTree / Social Section */}
        <section className="space-y-6 pt-8">
          <div className="text-center md:text-left">
            <h2 className="flex items-center justify-center gap-2 text-xl font-bold md:justify-start">
              <span>Links</span>
              <span className="bg-border/50 ml-4 hidden h-px flex-1 md:block"></span>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm font-medium italic">
              {t('slogan')}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                label: 'X (Twitter)',
                url: 'https://twitter.com/FlawInAffection',
                desc: t('linksSubtitle'),
              },
              {
                label: 'GitHub',
                url: 'https://github.com/tenzyu',
                desc: t('githubSubtitle'),
              },
              {
                label: 'YouTube',
                url: 'https://youtube.com/@tenzyu',
                desc: t('youtubeSubtitle'),
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border-border/40 bg-card/50 hover:bg-primary/5 hover:border-primary/30 flex items-center justify-between rounded-xl border p-4 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-foreground group-hover:text-primary font-bold transition-colors">
                    {link.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {link.desc}
                  </span>
                </div>
                <span className="text-muted-foreground/50 group-hover:text-primary transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Timeline Gallery Section */}
        <section className="space-y-6 pt-8">
          <div className="text-center md:text-left">
            <h2 className="flex items-center justify-center gap-2 text-xl font-bold md:justify-start">
              <span>{t('timeline')}</span>
              <span className="bg-border/50 ml-4 hidden h-px flex-1 md:block"></span>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm font-medium">
              {t('timelineDesc')}
            </p>
          </div>
          <div className="grid auto-rows-max grid-cols-1 gap-4 md:grid-cols-2 [&>div]:h-max">
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <SpoilerTweet id="1995756452284420100" />
            </div>
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <Tweet id="2000244564473549114" />
            </div>
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <Tweet id="2014212434240942405" />
            </div>
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <Tweet id="2021290058519806399" />
            </div>
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <Tweet id="2028101824994246820" />
            </div>
            <div
              data-theme="dark"
              className="w-full max-w-sm justify-self-center"
            >
              <Tweet id="2028490126226264471" />
            </div>
          </div>
        </section>

        {/* Music Recommendations Section */}
        <section className="space-y-6 pt-8">
          <div className="text-center md:text-left">
            <h2 className="flex items-center justify-center gap-2 text-xl font-bold md:justify-start">
              <span>{t('music')}</span>
              <span className="bg-border/50 ml-4 hidden h-px flex-1 md:block"></span>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm font-medium">
              {t('musicDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {['tOWeLMJNYz4', 'L7giMsyfFQQ', 'uIxtjaSJZmA', 'ksdvNgqOToQ'].map(
              (id) => (
                <div
                  key={id}
                  className="border-border/40 hover:border-primary/50 aspect-video w-full overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md"
                >
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${id}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Footer Link to Archive */}
        <section className="border-border/40 border-t pt-12 text-center md:text-left">
          <Link
            href="/archives/osu-profile"
            className="text-muted-foreground hover:text-primary inline-flex items-center text-xs font-medium transition-colors"
          >
            {t('archiveLink')}
          </Link>
        </section>
      </div>
    </div>
  )
}
