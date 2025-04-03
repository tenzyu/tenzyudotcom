"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
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

      <Card>
        <CardContent className="px-6 py-1">
          <h3 className="text-xl font-bold mb-4">osu! settings</h3>
          <div className="p-4 border rounded-md mt-2">
            <div
              className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
              style={{
                aspectRatio: "152/95",
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              <div className="absolute bottom-6 left-2 flex items-center justify-center text-sm text-gray-500">
                Wacom CTL-472 (152mm x 95mm)
              </div>

              <div
                className="absolute border-2 border-purple-500 rounded-sm"
                style={{
                  left: `${((83.06 - 58.0 / 2) / 152) * 100}%`,
                  top: `${((26.43 - 45.24 / 2) / 95) * 100}%`,
                  width: `${(58.0 / 152) * 100}%`,
                  height: `${(45.24 / 95) * 100}%`,
                }}
              >
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 text-xs rounded z-30">
                  Current: 58.0x45.24mm
                </div>
              </div>

              <div className="absolute bottom-2 right-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                Rotation: 180°
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-md mt-2">
            <div className="flex justify-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold border-2 border-purple-500">
                    Z
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold border-2 border-purple-500">
                    X
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm">
              <p className="font-medium">Current: QwQ</p>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Actuation: 0.15mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>RT trigger: 0.20mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>RT release: 0.20mm</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

