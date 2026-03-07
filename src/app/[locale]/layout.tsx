import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Serif_JP } from 'next/font/google'
import Script from 'next/script'
import { IntlayerClientProvider, type NextLayoutIntlayer } from 'next-intlayer'
import { getLocale, useIntlayer } from 'next-intlayer/server'
import { ThemeProvider } from '@/components/features/theme-provider'
import { BreadcrumbNav } from '@/components/site/breadcrumb-nav'
import { Container } from '@/components/site/container'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import '../globals.css'
import { getHTMLTextDir, getLocalizedUrl, locales } from 'intlayer'

export { generateStaticParams } from 'next-intlayer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSerifJp = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  subsets: ['latin'],
  fallback: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const site = useIntlayer('site', locale)
  const ogLocale = locale === 'ja' ? 'ja_JP' : 'en_US'
  const ogAlternateLocale = locale === 'ja' ? 'en_US' : 'ja_JP'
  const metadataBase = new URL('https://tenzyu.com')
  const localizedUrl = new URL(
    getLocalizedUrl('/', locale),
    metadataBase,
  ).toString()
  const alternateLanguages = Object.fromEntries(
    locales.map((localeItem) => [
      localeItem,
      new URL(getLocalizedUrl('/', localeItem), metadataBase).toString(),
    ]),
  )

  return {
    title: {
      template: site.titleTemplate.value,
      default: site.title.value,
    },
    description: site.description.value,
    keywords: [
      'tenzyu',
      'osu',
      'streamer',
      'twitch',
      'gaming',
      'テンジュ',
      '天珠',
    ],
    authors: [{ name: 'tenzyu', url: 'https://tenzyu.com' }],
    creator: 'tenzyu',
    publisher: 'tenzyu',
    metadataBase,
    alternates: {
      canonical: localizedUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: [ogAlternateLocale],
      url: localizedUrl,
      title: site.title.value,
      description: site.description.value,
      siteName: 'tenzyu.com',
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@tenzyudotcom',
      title: site.title.value,
      description: site.description.value,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params

  return (
    <html lang={locale} dir={getHTMLTextDir(locale)} suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/@react-grab/codex/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://pbs.twimg.com" />
        <link rel="preconnect" href="https://assets.ppy.sh" />
      </head>
      {/* NOTE: IntlayerClientProvider is used to provide the locale to client-side components. It can be placed in any parent component, including the layout. However, placing it in a layout is recommended because Next.js shares layout code across pages, making it more efficient. By using IntlayerClientProvider in the layout, you avoid reinitializing it for every page, improving performance and maintaining a consistent localization context throughout your application. */}
      <IntlayerClientProvider locale={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJp.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <TooltipProvider>
                <Header />
                <main className="-mb-16 grow -translate-y-16 transform pt-16">
                  <Container>
                    <BreadcrumbNav />
                    {children}
                    <BreadcrumbNav />
                  </Container>
                </main>
                <Toaster />
                <Footer locale={locale} />
                <Analytics />
                <SpeedInsights />
              </TooltipProvider>
            </div>
          </ThemeProvider>
        </body>
      </IntlayerClientProvider>
    </html>
  )
}

export default LocaleLayout
