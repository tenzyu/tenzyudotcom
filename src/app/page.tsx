import { LinkList } from "@/components/link-list"
import { YouTubeCarousel } from "@/components/youtube-carousel"
import { YouTubeShortsCarousel } from "@/components/youtube-shorts-carousel"
import { SelfIntroduction } from "@/components/self-introduction"
import { YOUTUBE_VIDEOS, YOUTUBE_SHORTS } from "@/data/youtube"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-background to-muted/50">
        <div className="container flex flex-col items-center gap-12 px-4 pb-16">
          <section className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-6">Featured Videos</h2>
            <YouTubeCarousel videos={YOUTUBE_VIDEOS} />
          </section>

          <section className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-6">Featured Shorts</h2>
            <YouTubeShortsCarousel videos={YOUTUBE_SHORTS} />
          </section>

          <section className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-6">About Me</h2>
            <SelfIntroduction />
          </section>

          <section className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-6">My Links</h2>
            <LinkList />
          </section>
        </div>
        <Toaster />
      </main>
    </>
  )
}

