import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'

export function MonitorSettings() {
  return (
    <Card className="h-full">
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg">Monitor</CardTitle>
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Visualization - Left side */}
          <div className="md:w-1/2">
            <div
              className="relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
              style={{
                aspectRatio: '16/9',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {/* Monitor frame */}
              <div className="absolute inset-2 rounded-md border-8 border-gray-700 dark:border-gray-900">
                {/* Monitor screen */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      280Hz
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      24.5&quot;
                    </div>
                  </div>
                </div>
                {/* Monitor stand */}
                <div className="absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 translate-y-full transform bg-gray-200 dark:bg-gray-700" />
              </div>
              {/* Response time indicator */}
              <div className="absolute top-3 right-3 rounded-full bg-purple-500 px-2 py-1 text-xs text-white">
                0.5ms
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className="md:w-1/2">
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-medium">Name:</div>
                <div className="text-lg">Acer XV252Q</div>
              </div>

              <div>
                <div className="mb-1 font-medium">Display:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span>Size:</span>
                    <span className="ml-2 font-medium">24.5 inches</span>
                  </div>
                  <div>
                    <span>Resolution:</span>
                    <span className="ml-2 font-medium">1920 × 1080</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 font-medium">Performance:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span>Refresh Rate:</span>
                    <span className="ml-2 font-medium">280Hz</span>
                  </div>
                  <div>
                    <span>Response Time:</span>
                    <span className="ml-2 font-medium">0.5ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
