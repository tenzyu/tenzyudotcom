'use client'

import { Toaster } from "@/components/ui/sonner";
import { LinkList } from "@/components/link-list";
import { YOUTUBE_SHORTS, YOUTUBE_VIDEOS } from "@/data/youtube";
import { YouTubeCarousel } from "@/components/youtube-calousel";
import { SelfIntroduction } from "@/components/self-introduction";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-center">Videos</h2>
        <YouTubeCarousel videos={YOUTUBE_VIDEOS} />

        <h2 className="text-2xl font-bold tracking-tight text-center mt-8">Shorts</h2>
        <YouTubeCarousel videos={YOUTUBE_SHORTS} />

        <h2 className="text-2xl font-bold tracking-tight text-center mt-8">About Me</h2>
        <SelfIntroduction />

        <h2 className="text-2xl font-bold tracking-tight text-center mt-8">My Links</h2>
        <LinkList />
      </div>
      <Toaster />
    </main>
  );
}
