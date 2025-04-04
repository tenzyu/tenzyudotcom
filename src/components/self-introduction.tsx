"use client"

import { Card, CardContent } from "@/components/ui/card"
import { OsuSkillChart } from "./osu-skill-chart"

export function SelfIntroduction() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardContent className="px-6 py-1">
          <h3 className="text-xl font-bold mb-4">配信する理由</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>成長記録</li>
            <li>osu のライバルを増やす</li>
            <li>お金を稼ぐ (生活をする)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Add the osu skill chart here */}
      <OsuSkillChart accuracy={79.01} aim={68.3} speed={42.04} lastUpdated="2025年4月3日" />
    </div>
  )
}

