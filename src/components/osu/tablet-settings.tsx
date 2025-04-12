import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'

export function TabletSettings() {
  return (
    <Card className="h-full">
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg">Tablet</CardTitle>
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Visualization - Left side */}
          <div className="md:w-1/2">
            <div
              className="relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
              style={{
                aspectRatio: '152/95',
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
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
                <div className="absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transform px-2 py-0.5 text-lg text-white">
                  58 x 45.24
                </div>
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className="md:w-1/2">
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-medium">Name:</div>
                <div className="text-lg">Wacom CTL-472</div>
              </div>

              <div>
                <div className="mb-1 font-medium">Area:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span>Width (mm):</span>
                    <span className="ml-2 font-medium">58</span>
                  </div>
                  <div>
                    <span>Height (mm):</span>
                    <span className="ml-2 font-medium">45.24</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 font-medium">Position:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span>X (mm):</span>
                    <span className="ml-2 font-medium">83.06</span>
                  </div>
                  <div>
                    <span>Y (mm):</span>
                    <span className="ml-2 font-medium">26.43</span>
                  </div>
                  <div>
                    <span>R (deg):</span>
                    <span className="ml-2 font-medium">180</span>
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
