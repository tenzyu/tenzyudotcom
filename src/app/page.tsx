import { Header } from '@/components/header'
import { KeyboardSettings } from '@/components/keyboard-settings'
import { LinkList } from '@/components/link-list'
import { MonitorSettings } from '@/components/monitor-settings'
import { OsuBestScores } from '@/components/osu-best-scores'
import { ProfileCard } from '@/components/profile-card'
import { TabletSettings } from '@/components/tablet-settings'
import { TwitterCarousel } from '@/components/twitter-carousel'
import { Toaster } from '@/components/ui/sonner'
import { YearlyGoals } from '@/components/yearly-goals'
import { YouTubeCarousel } from '@/components/youtube-carousel'
import { TWEETS } from '@/data/twitter'
import { YOUTUBE_PERSONAL_BEST_HISTORY, YOUTUBE_VIDEOS } from '@/data/youtube'
import { getOsuMe, getOsuMyBestScores } from '@/lib/osu-api'

export default async function Home() {
  const osuMe = await getOsuMe()
  const osuMyBestScores = await getOsuMyBestScores()

  return (
    <>
      <Header />
      <main className='flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-background to-muted/50'>
        <div className='container flex flex-col items-center gap-12 px-2 pb-16'>
          <section className='w-full pt-6'>
            <ProfileCard osuProfile={osuMe} />
          </section>
          {/* グリッドレイアウトで横並びにする */}
          <div className='w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-0 gap-y-12'>
            <section className='w-full'>
              <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
                Best Scores
              </h2>
              <OsuBestScores scores={osuMyBestScores} />
            </section>

            <section className='w-full'>
              <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
                2025年の目標
              </h2>
              <YearlyGoals />
            </section>
          </div>

          <section className='w-full'>
            <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
              PERSONAL BEST HISTORY
            </h2>
            <YouTubeCarousel videos={YOUTUBE_PERSONAL_BEST_HISTORY} />
          </section>

          <section className='w-full'>
            <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
              Featured Videos
            </h2>
            <YouTubeCarousel videos={YOUTUBE_VIDEOS} type='video' />
          </section>

          <section className='w-full'>
            <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
              Twitter Clips
            </h2>
            <span className='text-center block text-xs'>
              *ブラウザのトラッキングプロテクションで画像／動画が表示されない場合があります。
            </span>
            <TwitterCarousel tweets={TWEETS} />
          </section>

          <section className='w-full'>
            <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
              osu! settings
            </h2>
            <div className='w-full max-w-4xl mx-auto space-y-4'>
              <TabletSettings />
              <KeyboardSettings />
              <MonitorSettings />
            </div>
          </section>

          <section className='w-full'>
            <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
              My Links
            </h2>
            <LinkList />
          </section>
        </div>
        <Toaster />
      </main>
    </>
  )
}
