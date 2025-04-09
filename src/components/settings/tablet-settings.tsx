import { Card, CardContent, CardTitle } from '@/components/ui/card'

export function TabletSettings() {
  return (
    <Card className='h-full'>
      <CardContent className='px-6 py-4'>
        <CardTitle className='pb-4 text-lg'>Tablet</CardTitle>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Visualization - Left side */}
          <div className='md:w-1/2'>
            <div
              className='relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden'
              style={{
                aspectRatio: '152/95',
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              <div
                className='absolute rounded-sm bg-purple-500'
                style={{
                  left: `${((83.06 - 58.0 / 2) / 152) * 100}%`,
                  top: `${((26.43 - 45.24 / 2) / 95) * 100}%`,
                  width: `${(58.0 / 152) * 100}%`,
                  height: `${(45.24 / 95) * 100}%`,
                }}
              >
                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white px-2 py-0.5 text-lg z-30'>
                  58 x 45.24
                </div>
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className='md:w-1/2'>
            <div className='space-y-4'>
              <div>
                <div className='font-medium mb-1'>Name:</div>
                <div className='text-lg'>Wacom CTL-472</div>
              </div>

              <div>
                <div className='font-medium mb-1'>Area:</div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span>Width (mm):</span>
                    <span className='font-medium ml-2'>58</span>
                  </div>
                  <div>
                    <span>Height (mm):</span>
                    <span className='font-medium ml-2'>45.24</span>
                  </div>
                </div>
              </div>

              <div>
                <div className='font-medium mb-1'>Position:</div>
                <div className='grid grid-cols-3 gap-2'>
                  <div>
                    <span>X (mm):</span>
                    <span className='font-medium ml-2'>83.06</span>
                  </div>
                  <div>
                    <span>Y (mm):</span>
                    <span className='font-medium ml-2'>26.43</span>
                  </div>
                  <div>
                    <span>R (deg):</span>
                    <span className='font-medium ml-2'>180</span>
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
