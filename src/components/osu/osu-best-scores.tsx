import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Clock, Music } from 'lucide-react'
import Image from 'next/image'
import type { Score } from 'osu-api-v2-js'

type OsuBestScoresProps = {
  scores: Score.WithUserBeatmapBeatmapset[]
}

export function OsuBestScores({ scores }: OsuBestScoresProps) {
  if (!scores || scores.length === 0) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardContent className='px-6 py-4'>
          <div className='text-center py-8 text-muted-foreground'>
            スコアデータを読み込めませんでした
          </div>
        </CardContent>
      </Card>
    )
  }

  // ランクに応じた色とスタイルを取得
  const getRankStyle = (rank: string) => {
    switch (rank) {
      case 'XH':
      case 'SS':
        return 'text-yellow-400 border-yellow-400'
      case 'X':
      case 'S':
        return 'text-yellow-300 border-yellow-300'
      case 'SH':
        return 'text-green-400 border-green-400'
      case 'A':
        return 'text-green-400 border-green-400'
      case 'B':
        return 'text-blue-400 border-blue-400'
      case 'C':
        return 'text-purple-400 border-purple-400'
      case 'D':
        return 'text-red-400 border-red-400'
      default:
        return 'text-gray-400 border-gray-400'
    }
  }

  return (
    <div className='w-full max-w-md mx-auto space-y-1'>
      {scores.map((score, index) => {
        const rankStyle = getRankStyle(score.rank)

        return (
          <Card
            key={score.id}
            className='border rounded-lg overflow-hidden py-0'
          >
            <CardContent className='px-0'>
              <a
                href={`https://osu.ppy.sh/beatmapsets/${score.beatmapset.id}#osu/${score.beatmap.id}`}
                target='_blank'
                rel='noopener noreferrer'
                className='block hover:bg-gray-100 dark:hover:bg-zinc-950 transition-colors'
              >
                {/* ヘッダー: 画像、曲名、アーティスト */}
                <div className='flex items-center border-b border-gray-700'>
                  <div className='relative size-24 mr-3'>
                    <Image
                      src={
                        score.beatmapset.covers.list ||
                        '/placeholder.svg?height=48&width=48'
                      }
                      alt={score.beatmapset.title}
                      fill={true}
                      className='object-cover rounded'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      priority={index < 3}
                      loading={index < 3 ? 'eager' : 'lazy'}
                      quality={75}
                    />
                  </div>

                  <div className='flex-1 min-w-0'>
                    <CardTitle className='text-sm font-bold line-clamp-1 dark:text-white'>
                      {score.beatmapset.title}
                    </CardTitle>
                    <div className='text-xs text-gray-400'>
                      by {score.beatmapset.artist}
                    </div>
                    <div className='flex items-center text-xs text-gray-500 gap-2 mt-1'>
                      <div className='flex items-center gap-1'>
                        <Music className='h-3 w-3' />
                        <span>{score.beatmap.bpm.toFixed(0)}bpm</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        <span>
                          {Math.floor(score.beatmap.total_length / 60)}m{' '}
                          {score.beatmap.total_length % 60}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col pr-2 transform -translate-y-4'>
                    <div className='flex gap-2 items-center'>
                      <div className='w-10 h-10 flex items-center justify-center font-bold text-lg'>
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex justify-between px-2 py-1'>
                  <div className='text-pink-500 font-bold text-xl transform translate-y-1'>
                    {/* biome-ignore lint/style/noNonNullAssertion: <explanation> */}
                    {Math.round(score.pp!)}pp
                  </div>

                  <div className='flex flex-col gap-2 items-center justify-between'>
                    <div className='flex gap-2 items-center '>
                      {score.mods.length > 0 &&
                        score.mods.map(mod => (
                          <div
                            key={mod.acronym}
                            className='bg-red-900/50 flex items-center justify-center text-white text-xs h-6 w-10 rounded'
                          >
                            {mod.acronym}
                          </div>
                        ))}

                      <div
                        className={`border-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg ${rankStyle}`}
                      >
                        {score.rank}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
