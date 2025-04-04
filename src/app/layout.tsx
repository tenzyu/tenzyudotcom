import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const title = 'TENZYU | osu! player, streamer'
const description = 'osu! の日本一を目指しています。'
export const metadata: Metadata = {
  title,
  description,
  keywords: ["tenzyu", "osu", "streamer", "twitch", "gaming", "テンジュ", "天珠"],
  authors: [{ name: "tenzyu", url: "https://tenzyu.com" }],
  creator: "tenzyu",
  publisher: "tenzyu",
  // todo: ogp 画像
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://tenzyu.com",
    title,
    description,
    siteName: "tenzyu.com",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@tenzyudotcom",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

