import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import type React from 'react'

import { Container } from '@/components/common/container'
import { ThemeProvider } from '@/components/features/theme-provider'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const title = 'TENZYU | osu! player, streamer'
const description = 'osu! の日本一を目指しています。'
export const metadata: Metadata = {
  title,
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <div className="flex min-h-screen flex-col">
              <Header locale={locale} />
              <main className="-mb-16 flex-grow -translate-y-16 transform bg-zinc-100 pt-16 dark:bg-zinc-800">
                <Container>{children}</Container>
              </main>
              <Footer />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
