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

export const metadata: Metadata = {
  title: "tenzyu.com - osu! player",
  description: "天珠 (テンジュ) の公式サイト。osu! プレイヤー、ストリーマー、元プログラマー。",
  keywords: ["tenzyu", "osu", "streamer", "twitch", "gaming", "テンジュ", "天珠"],
  authors: [{ name: "tenzyu", url: "https://tenzyu.com" }],
  creator: "tenzyu",
  publisher: "tenzyu",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://tenzyu.com",
    title: "tenzyu.com - osu! player",
    description: "天珠 (テンジュ) の公式サイト。osu! プレイヤー、ストリーマー、元プログラマー。",
    siteName: "tenzyu.com",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@tenzyudotcom",
    title: "tenzyu.com - osu! player",
    description: "天珠 (テンジュ) の公式サイト。osu! プレイヤー、ストリーマー、元プログラマー。",
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

