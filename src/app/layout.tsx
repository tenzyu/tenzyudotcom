import dynamic from 'next/dynamic'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { BreadcrumbNav } from '@/components/site/breadcrumb-nav'
import { Container } from '@/components/site/container'
import { ThemeProvider } from '@/components/features/theme-provider'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import type { Metadata } from 'next'
import type React from 'react'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const title = "TENZYU's secret hideout"
const description = 'a secret hideout'
export const metadata: Metadata = {
  title: {
    template: "%s | TENZYU's secret hideout",
    default: title,
  },
  description,
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
  metadataBase: new URL('https://tenzyu.com'),
  // todo: ogp 画像
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://tenzyu.com',
    title,
    description,
    siteName: 'tenzyu.com',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@tenzyudotcom',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://pbs.twimg.com" />
        <link rel="preconnect" href="https://assets.ppy.sh" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <div className="flex min-h-screen flex-col">
              <Header locale={locale} />
              <main className="-mb-16 grow -translate-y-16 transform pt-16">
                <Container>
                  <BreadcrumbNav />
                  <TooltipProvider>{children}</TooltipProvider>
                  <BreadcrumbNav />
                </Container>
              </main>
              <Toaster />
              <Footer />
              <Analytics />
              <SpeedInsights />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
