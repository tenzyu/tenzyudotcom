"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

export function OsuSettings() {

    return (
    <div className="w-full max-w-md mx-auto space-y-4">

      <Card>
        <CardContent className="px-6 py-1">
          <CardTitle className="pb-4 text-lg">Tablet</CardTitle>
          <div
            className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
            style={{
              aspectRatio: "152/95",
              width: "100%",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            <div
              className="absolute rounded-sm bg-purple-500"
              style={{
                left: `${((83.06 - 58.0 / 2) / 152) * 100}%`,
                top: `${((26.43 - 45.24 / 2) / 95) * 100}%`,
                width: `${(58.0 / 152) * 100}%`,
                height: `${(45.24 / 95) * 100}%`,
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white px-2 py-0.5 text-lg z-30">
                58 x 45.24
              </div>
            </div>
          </div>

          {/* Tablet settings table */}
          <div className="mt-4">
            <div className="mb-2 text-lg">Wacom CTL-472</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-1">Area:</div>
                <div className="flex justify-between">
                  <span>Width (mm):</span>
                  <span className="font-medium">58</span>
                </div>
                <div className="flex justify-between">
                  <span>Height (mm):</span>
                  <span className="font-medium">45.24</span>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">Position:</div>
                <div className="flex justify-between">
                  <span>X (mm):</span>
                  <span className="font-medium">83.06</span>
                </div>
                <div className="flex justify-between">
                  <span>Y (mm):</span>
                  <span className="font-medium">26.43</span>
                </div>
                <div className="flex justify-between">
                  <span>R (deg):</span>
                  <span className="font-medium">180</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-6 py-1">
          <CardTitle className="pb-4 text-lg">Keyboard</CardTitle>
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

          <div className="mb-2 mt-3 text-lg">SayoDevice O3C (a.k.a. QwQ)</div>
          <div className="text-center mt-4 text-sm">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-6 py-1">
          <CardTitle className="pb-4 text-lg">Monitor</CardTitle>
          <div
            className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
            style={{ aspectRatio: "16/9", maxWidth: "400px", margin: "0 auto" }}
          >
            {/* Monitor frame */}
            <div className="absolute inset-2 border-8 border-gray-700 dark:border-gray-900 rounded-md">
              {/* Monitor screen */}
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">280Hz</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">24.5&quot;</div>
                </div>
              </div>
              {/* Monitor stand */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-16 h-4 bg-gray-800 dark:bg-black"></div>
            </div>
            {/* Response time indicator */}
            <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
              0.5ms
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-lg">Acer XV252Q</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-1">Display:</div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">24.5 inches</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="font-medium">1920 × 1080</span>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">Performance:</div>
                <div className="flex justify-between">
                  <span>Refresh Rate:</span>
                  <span className="font-medium">280Hz</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-medium">0.5ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
    )
}