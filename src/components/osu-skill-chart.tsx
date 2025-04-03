"use client"

import { Card, CardContent } from "@/components/ui/card"

interface OsuSkillProps {
  accuracy: number
  aim: number
  speed: number
  lastUpdated: string
}

export function OsuSkillChart({ accuracy, aim, speed, lastUpdated }: OsuSkillProps) {
  // Calculate the percentage for the progress bars (max value is 100)
  const accuracyPercentage = Math.min(accuracy, 100)
  const aimPercentage = Math.min(aim, 100)
  const speedPercentage = Math.min(speed, 100)

  return (
    <Card>
      <CardContent className="px-6 py-4">
        <h3 className="text-xl font-bold mb-4">osu! スキル偏差値</h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">ACCURACY</span>
              <span className="font-bold">{accuracy.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${accuracyPercentage}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">AIM</span>
              <span className="font-bold">{aim.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${aimPercentage}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">SPEED</span>
              <span className="font-bold">{speed.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${speedPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-right text-sm text-gray-500 dark:text-gray-400">最終更新日: {lastUpdated}</div>
      </CardContent>
    </Card>
  )
}

