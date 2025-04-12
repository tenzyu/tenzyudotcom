import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'

export function KeyboardSettings() {
  return (
    <Card className="h-full">
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg">Keyboard</CardTitle>
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Visualization - Left side */}
          <div className="md:w-1/2">
            {/* SayoDevice O3C keyboard visualization */}
            <div className="relative mx-auto aspect-[4/3] max-w-[400px] rounded-md bg-gray-100 p-4 dark:bg-[#2d3642]">
              {/* Knob */}
              <div className="absolute top-[4%] left-[3%] flex h-34 w-34 items-center justify-center rounded-full bg-gray-200 dark:bg-[#252c38]">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gray-300 dark:bg-[#1e2530]">
                  {/* Knob center */}
                  <div className="text-lg font-medium dark:text-gray-300">
                    Y
                  </div>

                  {/* Rotation indicators */}
                  <div className="absolute top-1/2 -left-5 -translate-y-1/2 transform text-gray-400">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <div className="absolute top-1/2 -right-5 -translate-y-1/2 transform text-gray-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Keys */}
              <div className="absolute right-0 bottom-[5%] left-0 flex justify-center gap-2">
                <div className="flex h-29 w-29 items-center justify-center rounded-md bg-gray-300 dark:bg-[#252c38]">
                  <span className="text-lg font-medium dark:text-gray-300">
                    C
                  </span>
                </div>
                <div className="flex h-29 w-29 items-center justify-center rounded-md bg-gray-300 dark:bg-[#252c38]">
                  <span className="text-lg font-medium dark:text-gray-300">
                    Z
                  </span>
                </div>
                <div className="flex h-29 w-29 items-center justify-center rounded-md bg-gray-300 dark:bg-[#252c38]">
                  <span className="text-lg font-medium dark:text-gray-300">
                    X
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className="md:w-1/2">
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-medium">Name:</div>
                <div className="text-lg">SayoDevice O3C v1 (QwQ)</div>
              </div>

              <div>
                <div className="mb-1 font-medium">Key Mapping:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span>Left Key:</span>
                    <span className="ml-2 font-medium">C</span>
                  </div>
                  <div>
                    <span>Middle Key:</span>
                    <span className="ml-2 font-medium">Z</span>
                  </div>
                  <div>
                    <span>Right Key:</span>
                    <span className="ml-2 font-medium">X</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 font-medium">Knob Functions:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span>Press:</span>
                    <span className="ml-2 font-medium">Y</span>
                  </div>
                  <div>
                    <span>Left Rotation:</span>
                    <span className="ml-2 font-medium">←</span>
                  </div>
                  <div>
                    <span>Right Rotation:</span>
                    <span className="ml-2 font-medium">→</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Actuation: 0.15mm</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>RT trigger: 0.20mm</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>RT release: 0.20mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
