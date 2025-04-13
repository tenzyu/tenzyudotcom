import { Clock, Music } from 'lucide-react'
import Image from 'next/image'
import type { Score } from 'osu-api-v2-js'
import { Suspense } from 'react'

import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'
import { Skeleton } from '@/components/shadcn-ui/skeleton'
import { ID_OSU, DEFAULT_SCORE_LIMIT } from '@/data/constants'
import { getUserScores } from '@/data/osu'
import { cn } from '@/lib/utils'

const RANK_STYLES = {
  XH: 'text-yellow-400 border-yellow-400',
  SS: 'text-yellow-400 border-yellow-400',
  X: 'text-yellow-300 border-yellow-300',
  S: 'text-yellow-300 border-yellow-300',
  SH: 'text-green-400 border-green-400',
  A: 'text-green-400 border-green-400',
  B: 'text-blue-400 border-blue-400',
  C: 'text-purple-400 border-purple-400',
  D: 'text-red-400 border-red-400',
} as const

type ScoreCardSkeletonProps = {
  className?: string
}

const ScoreCardSkeleton = ({ className }: ScoreCardSkeletonProps) => {
  return (
    <Card className={cn('overflow-hidden rounded-lg border py-0', className)}>
      <CardContent className="px-0">
        <div className="flex items-center border-b border-gray-700">
          <Skeleton className="mr-3 size-24" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex -translate-y-4 transform flex-col pr-2">
            <Skeleton className="size-10" />
          </div>
        </div>
        <div className="flex justify-between px-2 py-1">
          <Skeleton className="h-8 w-16" />
          <div className="flex gap-2">
            <Skeleton className="size-10" />
            <Skeleton className="size-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ScoreCardProps = {
  score: Score.WithUserBeatmapBeatmapset
  index: number
  className?: string
}

type BeatmapMetadataProps = {
  bpm: number
  totalLength: number
}

const BeatmapMetadata = ({ bpm, totalLength }: BeatmapMetadataProps) => (
  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
    <div className="flex items-center gap-1">
      <Music className="h-3 w-3" />
      <span>{bpm.toFixed(0)}bpm</span>
    </div>
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      <span>
        {Math.floor(totalLength / 60)}m {totalLength % 60}s
      </span>
    </div>
  </div>
)

type ModBadgeProps = {
  acronym: string
}

const ModBadge = ({ acronym }: ModBadgeProps) => (
  <div className="flex h-6 w-10 items-center justify-center rounded bg-red-900/50 text-xs text-white">
    {acronym}
  </div>
)

const ScoreCard = ({ score, index, className }: ScoreCardProps) => {
  const rankStyle =
    RANK_STYLES[score.rank as keyof typeof RANK_STYLES] ||
    'text-gray-400 border-gray-400'

  return (
    <Card className={cn('overflow-hidden rounded-lg border py-0', className)}>
      <CardContent className="px-0">
        <a
          href={`https://osu.ppy.sh/beatmapsets/${score.beatmapset.id}#osu/${score.beatmap.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-colors hover:bg-gray-100 dark:hover:bg-zinc-950"
        >
          <div className="flex items-center border-b border-gray-700">
            <div className="relative mr-3 size-24">
              <Image
                src={
                  score.beatmapset.covers.list ||
                  '/placeholder.svg?height=48&width=48'
                }
                alt={score.beatmapset.title}
                fill
                className="rounded object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                quality={75}
              />
            </div>

            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-1 text-sm font-bold dark:text-white">
                {score.beatmapset.title}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                by {score.beatmapset.artist}
              </div>
              <BeatmapMetadata
                bpm={score.beatmap.bpm}
                totalLength={score.beatmap.total_length}
              />
            </div>

            <div className="flex -translate-y-4 transform flex-col pr-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center text-lg font-bold">
                  <span>#{index + 1}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between px-2 py-1">
            <div className="translate-y-1 transform text-xl font-bold text-primary">
              {score.pp ? Math.round(score.pp) : 'N/A'}pp
            </div>

            <div className="flex flex-col items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {score.mods.length > 0 &&
                  score.mods.map((mod) => (
                    <ModBadge key={mod.acronym} acronym={mod.acronym} />
                  ))}

                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold',
                    rankStyle,
                  )}
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
}

const BestScoresContainer = async ({ limit }: { limit: number }) => {
  const scores = await getUserScores(
    ID_OSU,
    'best',
    0,
    { lazer: true },
    { limit },
  )

  return (
    <>
      {scores.map(
        (score, index) =>
          score && <ScoreCard key={score.id} score={score} index={index} />,
      )}
    </>
  )
}

export const OsuBestScores = () => {
  const limit = DEFAULT_SCORE_LIMIT

  return (
    <div className="mx-auto w-full max-w-md space-y-1">
      <Suspense
        fallback={
          <>
            {[...Array(limit)].map((_, index) => (
              <ScoreCardSkeleton key={index} />
            ))}
          </>
        }
      >
        <BestScoresContainer limit={limit} />
      </Suspense>
    </div>
  )
}
