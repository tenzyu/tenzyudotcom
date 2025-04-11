import { Geist, Geist_Mono } from 'next/font/google'

import { Analytics } from '@vercel/analytics/react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ThemeProvider } from '@/components/providers/theme-provider'

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
    <html lang={locale} suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <NextIntlClientProvider>
            <div className='flex flex-col min-h-screen'>
              {/* TODO: ヘッダー分ずらしてるけどもっといい方法がありそう */}
              <Header locale={locale} />
              <div className='flex-grow bg-zinc-100 dark:bg-zinc-800 transform -translate-y-16 pt-16 -mb-16'>
                {children}
              </div>
              <Footer />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
