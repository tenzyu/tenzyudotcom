import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'

export function MonitorSettings() {
  return (
    <Card className='h-full'>
      <CardContent className='px-6 py-4'>
        <CardTitle className='pb-4 text-lg'>Monitor</CardTitle>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Visualization - Left side */}
          <div className='md:w-1/2'>
            <div
              className='relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden'
              style={{
                aspectRatio: '16/9',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {/* Monitor frame */}
              <div className='absolute inset-2 border-8 border-gray-700 dark:border-gray-900 rounded-md'>
                {/* Monitor screen */}
                <div className='absolute inset-0 bg-gray-200 dark:bg-gray-600 flex items-center justify-center'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                      280Hz
                    </div>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      24.5&quot;
                    </div>
                  </div>
                </div>
                {/* Monitor stand */}
                <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-16 h-4 bg-gray-200 dark:bg-gray-700' />
              </div>
              {/* Response time indicator */}
              <div className='absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs'>
                0.5ms
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className='md:w-1/2'>
            <div className='space-y-4'>
              <div>
                <div className='font-medium mb-1'>Name:</div>
                <div className='text-lg'>Acer XV252Q</div>
              </div>

              <div>
                <div className='font-medium mb-1'>Display:</div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span>Size:</span>
                    <span className='font-medium ml-2'>24.5 inches</span>
                  </div>
                  <div>
                    <span>Resolution:</span>
                    <span className='font-medium ml-2'>1920 × 1080</span>
                  </div>
                </div>
              </div>

              <div>
                <div className='font-medium mb-1'>Performance:</div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span>Refresh Rate:</span>
                    <span className='font-medium ml-2'>280Hz</span>
                  </div>
                  <div>
                    <span>Response Time:</span>
                    <span className='font-medium ml-2'>0.5ms</span>
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
