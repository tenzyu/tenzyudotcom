import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getHTMLTextDir, getIntlayer } from 'intlayer'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Serif_JP } from 'next/font/google'
import Script from 'next/script'
import {
  IntlayerClientProvider,
  type LocalPromiseParams,
  type NextLayoutIntlayer,
} from 'next-intlayer'
import { BreadcrumbNav } from '@/components/shell/breadcrumb-nav'
import { Container } from '@/components/shell/container'
import { Footer } from '@/components/shell/footer'
import { Header } from '@/components/shell/header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { env, isDevelopment } from '@/config/env.contract'
import { ThemeProvider } from '@/features/site-controls/theme-provider'
import { buildSiteMetadata } from './_features/site-metadata'
import { buildSiteStructuredData } from './_features/site-structured-data'

import '../globals.css'

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

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  return buildSiteMetadata(locale)
}

const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params
  const shellContent = getIntlayer('shell', locale)
  const siteStructuredData = buildSiteStructuredData(locale)
  const shouldLoadReactGrabOverlay = isDevelopment && env.enableReactGrabOverlay

  return (
    <html lang={locale} dir={getHTMLTextDir(locale)} suppressHydrationWarning>
      <head>
        {shouldLoadReactGrabOverlay && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {shouldLoadReactGrabOverlay && (
          <Script
            src="//unpkg.com/@react-grab/codex/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Injecting structured data for SEO
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData),
          }}
        />
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
                <a
                  href="#main-content"
                  className="bg-background text-foreground ring-border focus-visible:ring-ring sr-only fixed top-4 left-4 z-60 rounded-md px-4 py-2 shadow-lg ring-1 transition focus:not-sr-only focus-visible:ring-2 focus-visible:outline-none"
                >
                  {shellContent.skipToContent}
                </a>
                <Header locale={locale} />
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="-mb-16 grow -translate-y-16 transform scroll-mt-20 pt-16 focus:outline-none"
                >
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
